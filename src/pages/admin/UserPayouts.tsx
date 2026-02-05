 import { useState } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { AdminLayout } from "@/components/admin/AdminLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { toast } from "sonner";
 import { Loader2, DollarSign, Users, Clock, CheckCircle2, Search, Filter, CreditCard, Building2 } from "lucide-react";
 import { format } from "date-fns";
 import { es } from "date-fns/locale";
 
 interface UserEarning {
   id: string;
   user_id: string;
   content_id: string | null;
   gross_amount: number;
   platform_fee_amount: number;
   net_amount: number;
   currency: string;
   status: string;
   created_at: string;
   paid_at: string | null;
 }
 
 interface UserBankingInfo {
   user_id: string;
   preferred_payment_method: string;
   bank_name: string | null;
   account_holder_name: string | null;
   mercadopago_email: string | null;
   paypal_email: string | null;
   is_verified: boolean;
 }
 
 const UserPayouts = () => {
   const queryClient = useQueryClient();
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedEarning, setSelectedEarning] = useState<UserEarning | null>(null);
 
   // Fetch all earnings
   const { data: earnings, isLoading: earningsLoading } = useQuery({
     queryKey: ['admin-earnings', statusFilter],
     queryFn: async () => {
       let query = supabase
         .from('user_earnings')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (statusFilter !== 'all') {
         query = query.eq('status', statusFilter);
       }
       
       const { data, error } = await query;
       if (error) throw error;
       return data as UserEarning[];
     },
   });
 
   // Fetch banking info for all users with earnings
   const { data: bankingInfoMap } = useQuery({
     queryKey: ['admin-banking-info'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('user_banking_info')
         .select('user_id, preferred_payment_method, bank_name, account_holder_name, mercadopago_email, paypal_email, is_verified');
       
       if (error) throw error;
       
       const map: Record<string, UserBankingInfo> = {};
       data?.forEach(info => {
         map[info.user_id] = info as UserBankingInfo;
       });
       return map;
     },
   });
 
   // Mark as paid mutation
   const markAsPaidMutation = useMutation({
     mutationFn: async (earningId: string) => {
       const { error } = await supabase
         .from('user_earnings')
         .update({ status: 'paid', paid_at: new Date().toISOString() })
         .eq('id', earningId);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['admin-earnings'] });
       toast.success('Pago marcado como realizado');
       setSelectedEarning(null);
     },
     onError: (error) => {
       toast.error('Error al actualizar: ' + error.message);
     },
   });
 
   // Calculate summary stats
   const stats = earnings?.reduce((acc, e) => ({
     totalPending: acc.totalPending + (e.status === 'pending' ? Number(e.net_amount) : 0),
     totalPaid: acc.totalPaid + (e.status === 'paid' ? Number(e.net_amount) : 0),
     totalPlatformFees: acc.totalPlatformFees + Number(e.platform_fee_amount),
     pendingCount: acc.pendingCount + (e.status === 'pending' ? 1 : 0),
     paidCount: acc.paidCount + (e.status === 'paid' ? 1 : 0),
   }), {
     totalPending: 0,
     totalPaid: 0,
     totalPlatformFees: 0,
     pendingCount: 0,
     paidCount: 0,
   }) || {
     totalPending: 0,
     totalPaid: 0,
     totalPlatformFees: 0,
     pendingCount: 0,
     paidCount: 0,
   };
 
   const getPaymentMethodIcon = (method: string) => {
     switch (method) {
       case 'bank_transfer': return <Building2 className="h-4 w-4" />;
       case 'mercadopago': return <CreditCard className="h-4 w-4" />;
       case 'paypal': return <CreditCard className="h-4 w-4" />;
       default: return <DollarSign className="h-4 w-4" />;
     }
   };
 
   const getPaymentDetails = (userId: string) => {
     const info = bankingInfoMap?.[userId];
     if (!info) return { method: 'No configurado', details: '-', verified: false };
     
     switch (info.preferred_payment_method) {
       case 'bank_transfer':
         return { 
           method: 'Transferencia', 
           details: info.bank_name || '-', 
           verified: info.is_verified 
         };
       case 'mercadopago':
         return { 
           method: 'MercadoPago', 
           details: info.mercadopago_email || '-', 
           verified: info.is_verified 
         };
       case 'paypal':
         return { 
           method: 'PayPal', 
           details: info.paypal_email || '-', 
           verified: info.is_verified 
         };
       default:
         return { method: 'No configurado', details: '-', verified: false };
     }
   };
 
   if (earningsLoading) {
     return (
       <AdminLayout>
         <div className="flex items-center justify-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
         </div>
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_hsl(180,100%,50%)]">
             Pagos a Usuarios
           </h1>
           <p className="text-muted-foreground mt-1">
             Gestiona los pagos pendientes y realizados a creadores de contenido
           </p>
         </div>
 
         {/* Stats Cards */}
         <div className="grid gap-4 md:grid-cols-4">
           <Card className="bg-card/50 border-yellow-500/20">
             <CardContent className="pt-6">
               <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-yellow-500/10">
                   <Clock className="h-6 w-6 text-yellow-400" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
                   <p className="text-2xl font-bold text-yellow-400">
                     ${stats.totalPending.toFixed(2)}
                   </p>
                   <p className="text-xs text-muted-foreground">{stats.pendingCount} transacciones</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="bg-card/50 border-green-500/20">
             <CardContent className="pt-6">
               <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-green-500/10">
                   <CheckCircle2 className="h-6 w-6 text-green-400" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Total Pagado</p>
                   <p className="text-2xl font-bold text-green-400">
                     ${stats.totalPaid.toFixed(2)}
                   </p>
                   <p className="text-xs text-muted-foreground">{stats.paidCount} pagos</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="bg-card/50 border-cyan-500/20">
             <CardContent className="pt-6">
               <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-cyan-500/10">
                   <DollarSign className="h-6 w-6 text-cyan-400" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Comisiones Plataforma</p>
                   <p className="text-2xl font-bold text-cyan-400">
                     ${stats.totalPlatformFees.toFixed(2)}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="bg-card/50 border-purple-500/20">
             <CardContent className="pt-6">
               <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-purple-500/10">
                   <Users className="h-6 w-6 text-purple-400" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Usuarios con Datos</p>
                   <p className="text-2xl font-bold text-purple-400">
                     {Object.keys(bankingInfoMap || {}).length}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Filters */}
         <Card className="bg-card/50 border-cyan-500/20">
           <CardContent className="pt-6">
             <div className="flex flex-wrap gap-4">
               <div className="flex-1 min-w-[200px]">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     placeholder="Buscar por ID de usuario..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10"
                   />
                 </div>
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="w-[180px]">
                   <Filter className="h-4 w-4 mr-2" />
                   <SelectValue placeholder="Estado" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos</SelectItem>
                   <SelectItem value="pending">Pendientes</SelectItem>
                   <SelectItem value="approved">Aprobados</SelectItem>
                   <SelectItem value="paid">Pagados</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </CardContent>
         </Card>
 
         {/* Earnings Table */}
         <Card className="bg-card/50 border-cyan-500/20">
           <CardHeader>
             <CardTitle className="text-cyan-400">Historial de Ganancias</CardTitle>
             <CardDescription>
               Lista de todas las ganancias generadas por los usuarios
             </CardDescription>
           </CardHeader>
           <CardContent>
             {!earnings || earnings.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No hay ganancias registradas</p>
               </div>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Fecha</TableHead>
                     <TableHead>Usuario</TableHead>
                     <TableHead>Método de Pago</TableHead>
                     <TableHead className="text-right">Bruto</TableHead>
                     <TableHead className="text-right">Comisión</TableHead>
                     <TableHead className="text-right">Neto</TableHead>
                     <TableHead>Estado</TableHead>
                     <TableHead>Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {earnings
                     .filter(e => !searchTerm || e.user_id.includes(searchTerm))
                     .map((earning) => {
                       const paymentInfo = getPaymentDetails(earning.user_id);
                       return (
                         <TableRow key={earning.id}>
                           <TableCell className="text-sm">
                             {format(new Date(earning.created_at), "dd/MM/yyyy", { locale: es })}
                           </TableCell>
                           <TableCell className="font-mono text-xs">
                             {earning.user_id.substring(0, 8)}...
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               {getPaymentMethodIcon(bankingInfoMap?.[earning.user_id]?.preferred_payment_method || '')}
                               <div>
                                 <p className="text-sm font-medium">{paymentInfo.method}</p>
                                 <p className="text-xs text-muted-foreground">{paymentInfo.details}</p>
                               </div>
                               {paymentInfo.verified && (
                                 <CheckCircle2 className="h-3 w-3 text-green-400" />
                               )}
                             </div>
                           </TableCell>
                           <TableCell className="text-right">
                             ${Number(earning.gross_amount).toFixed(2)}
                           </TableCell>
                           <TableCell className="text-right text-muted-foreground">
                             -${Number(earning.platform_fee_amount).toFixed(2)}
                           </TableCell>
                           <TableCell className="text-right font-bold text-green-400">
                             ${Number(earning.net_amount).toFixed(2)}
                           </TableCell>
                           <TableCell>
                             <Badge 
                               variant="outline"
                               className={
                                 earning.status === 'paid' 
                                   ? 'border-green-500/30 text-green-400'
                                   : earning.status === 'pending'
                                   ? 'border-yellow-500/30 text-yellow-400'
                                   : 'border-cyan-500/30 text-cyan-400'
                               }
                             >
                               {earning.status === 'paid' ? 'Pagado' : 
                                earning.status === 'pending' ? 'Pendiente' : 
                                earning.status === 'approved' ? 'Aprobado' : earning.status}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             {earning.status === 'pending' && (
                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                     onClick={() => setSelectedEarning(earning)}
                                   >
                                     Marcar Pagado
                                   </Button>
                                 </DialogTrigger>
                                 <DialogContent>
                                   <DialogHeader>
                                     <DialogTitle>Confirmar Pago</DialogTitle>
                                     <DialogDescription>
                                       ¿Confirmas que has realizado el pago de ${Number(earning.net_amount).toFixed(2)} a este usuario?
                                     </DialogDescription>
                                   </DialogHeader>
                                   <div className="py-4">
                                     <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                       <div className="flex justify-between">
                                         <span className="text-muted-foreground">Método:</span>
                                         <span>{paymentInfo.method}</span>
                                       </div>
                                       <div className="flex justify-between">
                                         <span className="text-muted-foreground">Destino:</span>
                                         <span>{paymentInfo.details}</span>
                                       </div>
                                       <div className="flex justify-between font-bold">
                                         <span>Monto:</span>
                                         <span className="text-green-400">${Number(earning.net_amount).toFixed(2)}</span>
                                       </div>
                                     </div>
                                   </div>
                                   <DialogFooter>
                                     <Button variant="outline" onClick={() => setSelectedEarning(null)}>
                                       Cancelar
                                     </Button>
                                     <Button 
                                       onClick={() => markAsPaidMutation.mutate(earning.id)}
                                       disabled={markAsPaidMutation.isPending}
                                       className="bg-green-600 hover:bg-green-700"
                                     >
                                       {markAsPaidMutation.isPending && (
                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                       )}
                                       Confirmar Pago
                                     </Button>
                                   </DialogFooter>
                                 </DialogContent>
                               </Dialog>
                             )}
                             {earning.status === 'paid' && earning.paid_at && (
                               <span className="text-xs text-muted-foreground">
                                 {format(new Date(earning.paid_at), "dd/MM/yyyy")}
                               </span>
                             )}
                           </TableCell>
                         </TableRow>
                       );
                     })}
                 </TableBody>
               </Table>
             )}
           </CardContent>
         </Card>
       </div>
     </AdminLayout>
   );
 };
 
 export default UserPayouts;