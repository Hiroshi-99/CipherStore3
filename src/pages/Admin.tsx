import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, LogOut, Search, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  username: string;
  status: string;
  created_at: string;
  payment_proof: string;
  user_id: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<{id: string, action: 'approve' | 'reject'} | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    // If auth is loaded and user isn't admin, this will help with debugging
    if (user !== null) {
      console.log('Admin page accessed. User auth state:', { user: !!user, isAdmin });
      setAuthLoading(false);
    }
  }, [user, isAdmin]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.username.toLowerCase().includes(query) || 
        order.id.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(result);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Order ${newStatus} successfully`);
      
      // Update local state to avoid refetching
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
      setOrderToConfirm(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  // Confirmation dialog for status changes
  const ConfirmationDialog = () => {
    if (!orderToConfirm) return null;
    
    const { id, action } = orderToConfirm;
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const actionStatus = action === 'approve' ? 'approved' : 'rejected';
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-medium text-white mb-4">Confirm Action</h3>
          <p className="text-gray-300 mb-6">
            Are you sure you want to {actionText} this order?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setOrderToConfirm(null)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusChange(id, actionStatus)}
              className={`px-4 py-2 ${
                action === 'approve' 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white rounded-lg flex items-center gap-2`}
              disabled={isUpdating}
            >
              {isUpdating && <RefreshCw className="animate-spin" size={16} />}
              Confirm {actionText.charAt(0).toUpperCase() + actionText.slice(1)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // You can add a loading state if needed
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto text-emerald-400 animate-spin mb-4" />
          <div className="text-white text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

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

        {/* Filters & Search */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchOrders}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Main Content */}
        <main className="py-6">
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Orders</h2>
                <div className="text-sm text-gray-400">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              </div>
              
              {loading && orders.length === 0 ? (
                <div className="text-center py-16">
                  <RefreshCw size={40} className="mx-auto text-emerald-400 animate-spin mb-4" />
                  <div className="text-gray-400">Loading orders...</div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-800/50 rounded-lg">
                  <div className="text-gray-400 text-lg">No orders found</div>
                  {searchQuery || statusFilter !== 'all' ? (
                    <p className="text-gray-500 mt-2">Try adjusting your filters</p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-700/50 hover:bg-gray-700/70 transition-colors rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(order.status)}
                          <h3 className="text-white font-medium">
                            Order by {order.username}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            order.status === 'approved' ? 'bg-emerald-900/60 text-emerald-300' :
                            order.status === 'rejected' ? 'bg-red-900/60 text-red-300' :
                            'bg-yellow-900/60 text-yellow-300'
                          }`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          ID: <span className="text-gray-300 font-mono">{order.id.substring(0, 8)}</span> · 
                          Ordered on: {new Date(order.created_at).toLocaleDateString()} at {' '}
                          {new Date(order.created_at).toLocaleTimeString()}
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
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="flex gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setOrderToConfirm({ id: order.id, action: 'approve' })}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                            disabled={isUpdating}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setOrderToConfirm({ id: order.id, action: 'reject' })}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            disabled={isUpdating}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}

export default Admin;