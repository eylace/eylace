 import { useState } from 'react';
 import { 
   Package, 
   Truck, 
   CheckCircle, 
   Clock,
   ChevronDown,
   ChevronUp,
   Loader2,
   Send
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
 } from '@/components/ui/card';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { useAdminOrders, AdminOrder } from '@/hooks/useAdminData';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
   pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
   processing: { label: 'Processing', color: 'bg-blue-500/10 text-blue-600', icon: Package },
   shipped: { label: 'Shipped', color: 'bg-purple-500/10 text-purple-600', icon: Truck },
   out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-500/10 text-orange-600', icon: Truck },
   delivered: { label: 'Delivered', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
   cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600', icon: Package },
 };
 
 export const AdminOrdersTab = () => {
   const { orders, isLoading, updateOrderStatus } = useAdminOrders();
   const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
   const [updating, setUpdating] = useState<string | null>(null);
   const [trackingInfo, setTrackingInfo] = useState<Record<string, { carrier: string; tracking_number: string }>>({});
 
   const handleStatusUpdate = async (orderId: string, newStatus: string) => {
     setUpdating(orderId);
     const tracking = trackingInfo[orderId];
     
     const { error } = await updateOrderStatus(orderId, newStatus, tracking);
     
     if (error) {
       toast.error('Failed to update order status');
     } else {
       toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`);
     }
     setUpdating(null);
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
       </div>
     );
   }
 
   if (orders.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
           <p className="text-muted-foreground">No orders found</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Package className="h-5 w-5" />
           All Orders ({orders.length})
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="space-y-4">
           {orders.map((order) => {
             const status = statusConfig[order.status] || statusConfig.pending;
             const StatusIcon = status.icon;
             const isExpanded = expandedOrder === order.id;
 
             return (
               <div key={order.id} className="border rounded-lg overflow-hidden">
                 <div 
                   className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                   onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                 >
                   <div className="flex items-center gap-4">
                     <div>
                       <p className="font-medium">Order #{order.order_number}</p>
                       <p className="text-sm text-muted-foreground">
                         {order.profile?.first_name} {order.profile?.last_name} • {order.profile?.email}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     <Badge className={cn('gap-1', status.color)}>
                       <StatusIcon className="h-3 w-3" />
                       {status.label}
                     </Badge>
                     <span className="font-bold">${order.total.toFixed(2)}</span>
                     <span className="text-sm text-muted-foreground">
                       {format(new Date(order.created_at), 'MMM d, yyyy')}
                     </span>
                     {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                   </div>
                 </div>
 
                 {isExpanded && (
                   <div className="p-4 border-t bg-secondary/20">
                     <div className="grid md:grid-cols-2 gap-6">
                       {/* Order Items */}
                       <div>
                         <h4 className="font-semibold mb-3">Order Items</h4>
                         <div className="space-y-2">
                           {order.items?.map((item) => (
                             <div key={item.id} className="flex items-center gap-3 p-2 bg-background rounded">
                               {item.product_image && (
                                 <img 
                                   src={item.product_image} 
                                   alt={item.product_name}
                                   className="w-12 h-12 rounded object-cover"
                                 />
                               )}
                               <div className="flex-1 min-w-0">
                                 <p className="font-medium truncate">{item.product_name}</p>
                                 <p className="text-sm text-muted-foreground">
                                   Qty: {item.quantity} × ${item.price.toFixed(2)}
                                 </p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
 
                       {/* Update Status */}
                       <div className="space-y-4">
                         <div>
                           <Label>Update Status</Label>
                           <Select
                             value={order.status}
                             onValueChange={(value) => handleStatusUpdate(order.id, value)}
                             disabled={updating === order.id}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="processing">Processing</SelectItem>
                               <SelectItem value="shipped">Shipped</SelectItem>
                               <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                               <SelectItem value="delivered">Delivered</SelectItem>
                               <SelectItem value="cancelled">Cancelled</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
 
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <Label>Carrier</Label>
                             <Input
                               placeholder="e.g., FedEx"
                               value={trackingInfo[order.id]?.carrier || order.carrier || ''}
                               onChange={(e) => setTrackingInfo(prev => ({
                                 ...prev,
                                 [order.id]: { ...prev[order.id], carrier: e.target.value }
                               }))}
                             />
                           </div>
                           <div>
                             <Label>Tracking Number</Label>
                             <Input
                               placeholder="Enter tracking #"
                               value={trackingInfo[order.id]?.tracking_number || order.tracking_number || ''}
                               onChange={(e) => setTrackingInfo(prev => ({
                                 ...prev,
                                 [order.id]: { ...prev[order.id], tracking_number: e.target.value }
                               }))}
                             />
                           </div>
                         </div>
 
                         <Button 
                           className="w-full gap-2"
                           onClick={() => handleStatusUpdate(order.id, order.status)}
                           disabled={updating === order.id}
                         >
                           {updating === order.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Send className="h-4 w-4" />
                           )}
                           Update Tracking Info
                         </Button>
 
                         {order.tracking_number && (
                           <p className="text-sm text-muted-foreground">
                             Current: {order.carrier} - {order.tracking_number}
                           </p>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             );
           })}
         </div>
       </CardContent>
     </Card>
   );
 };