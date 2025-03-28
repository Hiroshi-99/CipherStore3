import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Search from 'lucide-react/dist/esm/icons/search';
import Filter from 'lucide-react/dist/esm/icons/filter';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { sendTelegramNotification } from '../lib/telegramNotifications';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Order {
  id: string;
  username: string;
  status: string;
  created_at: string;
  payment_proof: string;
  account_details?: {
    username?: string;
    password?: string;
    additional_info?: string;
  };
}

function Admin() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    username: '',
    password: '',
    additional_info: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const parentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Memoize filterOrders
  const filterOrders = useCallback(() => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.username.toLowerCase().includes(term) || 
        order.id.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [orders, statusFilter, searchTerm]);
  
  // Use useMemo for filtered orders
  const filteredOrdersData = useMemo(() => {
    return filterOrders();
  }, [filterOrders]);
  
  // Update effect to use memoized value
  useEffect(() => {
    setFilteredOrders(filteredOrdersData);
  }, [filteredOrdersData]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          username, 
          status, 
          created_at, 
          payment_proof,
          account_details
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Memoize handlers
  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Get the updated order details
      const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Send Telegram notification about status change
      if (updatedOrder) {
        const statusEmoji = newStatus === 'approved' ? '✅' : '❌';
        const message = `
<b>${statusEmoji} Order Status Updated</b>

<b>Minecraft Username:</b> ${updatedOrder.username}
<b>Order ID:</b> ${updatedOrder.id}
<b>New Status:</b> ${newStatus.toUpperCase()}
<b>Updated at:</b> ${new Date().toLocaleString()}

${newStatus === 'approved' 
  ? 'Please proceed with providing account details.'
  : 'No further action needed for this order.'}
`;
        await sendTelegramNotification(message);
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
      console.error(error);
    }
  }, []);

  const handleSubmitAccountDetails = async () => {
    try {
      if (!selectedOrder) return;
      
      const { error } = await supabase
        .from('orders')
        .update({
          account_details: accountDetails
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Send Telegram notification about account details provided
      const message = `
<b>🔑 Account Details Provided</b>

<b>Minecraft Username:</b> ${selectedOrder.username}
<b>Order ID:</b> ${selectedOrder.id}
<b>Updated at:</b> ${new Date().toLocaleString()}

Account details have been added to this order.
`;
      await sendTelegramNotification(message);

      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, account_details: accountDetails } 
          : order
      ));
      
      setIsAccountModalOpen(false);
      setSelectedOrder(null);
      setAccountDetails({ username: '', password: '', additional_info: '' });
      toast.success('Account details added successfully');
    } catch (error) {
      toast.error('Failed to add account details');
      console.error(error);
    }
  };

  const openAccountDetails = (order: Order) => {
    setSelectedOrder(order);
    // Pre-fill form if account details already exist
    if (order.account_details) {
      setAccountDetails({
        username: order.account_details.username || '',
        password: order.account_details.password || '',
        additional_info: order.account_details.additional_info || ''
      });
    } else {
      setAccountDetails({ username: '', password: '', additional_info: '' });
    }
    setIsAccountModalOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-yellow-400" size={20} />;
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(order => order.status === 'pending').length;
    const approved = orders.filter(order => order.status === 'approved').length;
    const rejected = orders.filter(order => order.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getOrderStats();

  // Create virtualizer for order list
  const rowVirtualizer = useVirtualizer({
    count: filteredOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Adjust based on your item height
    overscan: 5,
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage orders and accounts</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Back to Store
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </header>

        {/* Order Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-gray-400 text-sm mb-1">Total Orders</h3>
            <p className="text-white text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-yellow-400 text-sm mb-1">Pending</h3>
            <p className="text-white text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-emerald-400 text-sm mb-1">Approved</h3>
            <p className="text-white text-2xl font-bold">{stats.approved}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-red-400 text-sm mb-1">Rejected</h3>
            <p className="text-white text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-6">
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Orders</h2>
                <button 
                  onClick={fetchOrders}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-white flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="bg-gray-700 text-white rounded-lg py-2 pl-10 pr-4 w-full"
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    className="bg-gray-700 text-white rounded-lg py-2 px-4"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Loading orders...</div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">
                    {orders.length === 0 ? "No orders found" : "No orders match your filters"}
                  </div>
                </div>
              ) : (
                <div ref={parentRef} className="overflow-auto h-[calc(100vh-200px)]">
                  <div
                    className="relative w-full"
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                      const order = filteredOrders[virtualItem.index];
                      return (
                        <div
                          key={order.id}
                          className="absolute top-0 left-0 w-full"
                          style={{
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div
                            className="bg-gray-700/50 rounded-lg p-6 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {getStatusIcon(order.status)}
                                <h3 className="text-white font-medium">
                                  Order by {order.username}
                                </h3>
                                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                  ID: {order.id.substring(0, 8)}...
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">
                                Ordered on: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                              {order.payment_proof && (
                                <a
                                  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${order.payment_proof}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block"
                                >
                                  View Payment Proof
                                </a>
                              )}
                              
                              {order.account_details && order.status === 'approved' && (
                                <div className="mt-2">
                                  <span className="text-xs bg-emerald-600/30 text-emerald-300 px-2 py-1 rounded">
                                    Account details provided
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusChange(order.id, 'approved')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(order.id, 'rejected')}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            
                            {order.status === 'approved' && (
                              <div className="flex gap-2">
                                <div className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400">
                                  Approved
                                </div>
                                <button
                                  onClick={() => openAccountDetails(order)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  {order.account_details ? 'Edit Account' : 'Add Account'}
                                </button>
                              </div>
                            )}
                            
                            {order.status === 'rejected' && (
                              <div className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400">
                                Rejected
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Add pagination controls */}
                  <div className="flex justify-between items-center mt-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>Page {currentPage}</span>
                    <button 
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={filteredOrders.length < pageSize}
                      className="bg-gray-700 px-3 py-1 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Account Details Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">
              Account Details for {selectedOrder?.username}
            </h3>
            <p className="text-gray-400 mb-4">
              These details will be sent to the user's mail box, not via email.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Account Username
                </label>
                <input
                  type="text"
                  value={accountDetails.username}
                  onChange={(e) => setAccountDetails({...accountDetails, username: e.target.value})}
                  className="bg-gray-700 text-white rounded-lg py-2 px-4 w-full"
                  placeholder="Enter account username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Account Password
                </label>
                <input
                  type="text"
                  value={accountDetails.password}
                  onChange={(e) => setAccountDetails({...accountDetails, password: e.target.value})}
                  className="bg-gray-700 text-white rounded-lg py-2 px-4 w-full"
                  placeholder="Enter account password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Additional Information
                </label>
                <textarea
                  value={accountDetails.additional_info}
                  onChange={(e) => setAccountDetails({...accountDetails, additional_info: e.target.value})}
                  className="bg-gray-700 text-white rounded-lg py-2 px-4 w-full h-24 resize-none"
                  placeholder="Enter any additional information"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAccountDetails}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;