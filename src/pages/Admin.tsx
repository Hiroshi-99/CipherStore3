import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, LogOut, Search, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: string;
  username: string;
  status: string;
  created_at: string;
  payment_proof: string;
}

function Admin() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
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
    
    setFilteredOrders(result);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Order ${newStatus} successfully`);
      fetchOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    }
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
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
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
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="flex flex-col gap-2">
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
                          <p className="text-xs text-gray-400 italic mt-1">
                            Note: Account details will be sent to customer via mail box, not email.
                          </p>
                        </div>
                      )}
                      
                      {order.status !== 'pending' && (
                        <div className="flex flex-col items-end">
                          <div className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                          {order.status === 'approved' && (
                            <p className="text-xs text-emerald-400 mt-2">
                              Account details will be sent via mail box
                            </p>
                          )}
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
    </div>
  );
}

export default Admin;