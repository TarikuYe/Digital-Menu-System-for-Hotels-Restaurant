
import React, { useState, useEffect } from 'react';
import { tablesAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const WaiterDashboard = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTables = async () => {
        try {
            const response = await tablesAPI.getAll();
            setTables(response.data.tables);
            setLoading(false);
        } catch (error) {
            console.error('Fetch tables error:', error);
            toast.error('Failed to load tables');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (tableId, newStatus) => {
        try {
            await tablesAPI.updateStatus(tableId, newStatus);
            toast.success(`Table updated to ${newStatus}`);
            fetchTables();
        } catch (error) {
            console.error('Update status error:', error);
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-success/20 border-success text-success-content';
            case 'occupied': return 'bg-error/20 border-error text-error-content'; // Occupied is "red" (busy)
            case 'dirty': return 'bg-warning/20 border-warning text-warning-content';
            case 'reserved': return 'bg-info/20 border-info text-info-content';
            default: return 'bg-base-200 border-base-300';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-base-content/50">Loading tables...</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold font-heading text-base-content">
                    <span className="text-primary">Tables</span> Overview
                </h1>
                <button className="btn btn-ghost btn-circle" onClick={fetchTables}>
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => (
                    <div
                        key={table.id}
                        className={`card border-2 shadow-sm transition-all hover:shadow-md ${getStatusColor(table.status)}`}
                    >
                        <div className="card-body p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black opacity-80">#{table.table_number}</h2>
                                    <p className="text-sm font-medium opacity-60 uppercase tracking-widest mt-1">{table.status}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {table.active_orders_count > 0 && (
                                        <div className="badge badge-error gap-1 p-3">
                                            <span className="font-bold">{table.active_orders_count}</span> Orders
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-sm opacity-60">
                                        <Users className="w-4 h-4" /> {table.capacity}
                                    </div>
                                </div>
                            </div>

                            {table.active_session_id && (
                                <div className="mt-4 p-2 bg-base-100/50 rounded-lg text-xs">
                                    <span className="font-bold">Guest:</span> {table.guest_name || 'Anonymous'}
                                </div>
                            )}

                            <div className="card-actions justify-end mt-6">
                                {table.status === 'dirty' && (
                                    <button
                                        className="btn btn-sm btn-success w-full"
                                        onClick={() => handleStatusChange(table.id, 'available')}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Mark Clean
                                    </button>
                                )}

                                {table.status === 'available' && (
                                    <button
                                        className="btn btn-sm btn-ghost w-full"
                                        onClick={() => handleStatusChange(table.id, 'occupied')}
                                    >
                                        Mark Occupied
                                    </button>
                                )}

                                {table.status === 'occupied' && (
                                    <button
                                        className="btn btn-sm btn-warning w-full"
                                        onClick={() => handleStatusChange(table.id, 'dirty')}
                                    >
                                        Mark Dirty (Clear)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WaiterDashboard;
