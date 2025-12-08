import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, DollarSign, TrendingUp, Users, ShoppingCart, CreditCard, Calendar, Heart, CalendarDays, CalendarCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ['hsl(180, 100%, 50%)', 'hsl(280, 100%, 60%)', 'hsl(45, 100%, 50%)', 'hsl(120, 100%, 40%)'];

const SalesAnalytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("30");

  const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();

  // Fetch purchases
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['admin-purchases', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_purchases')
        .select(`
          *,
          content_uploads(title, uploader_id)
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-subscriptions', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch donations
  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['admin-donations', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch payment settings for percentages
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_payment_settings')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const isLoading = purchasesLoading || subscriptionsLoading || donationsLoading;

  // Calculate statistics
  const totalPurchases = purchases?.length || 0;
  const totalSubscriptions = subscriptions?.length || 0;
  const totalDonations = donations?.length || 0;
  
  // Subscription breakdowns
  const monthlySubscriptions = subscriptions?.filter(s => s.plan_type === 'monthly') || [];
  const annualSubscriptions = subscriptions?.filter(s => s.plan_type === 'annual') || [];
  
  const monthlySubRevenue = monthlySubscriptions.reduce((acc, s) => acc + Number(s.amount), 0);
  const annualSubRevenue = annualSubscriptions.reduce((acc, s) => acc + Number(s.amount), 0);
  
  const purchaseRevenue = purchases?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
  const subscriptionRevenue = subscriptions?.reduce((acc, s) => acc + Number(s.amount), 0) || 0;
  const donationsRevenue = donations?.reduce((acc, d) => acc + Number(d.amount), 0) || 0;
  const totalRevenue = purchaseRevenue + subscriptionRevenue + donationsRevenue;

  // Get percentage settings
  const singlePurchaseSetting = paymentSettings?.find(s => s.setting_key === 'single_content_purchase');
  const platformPercentage = (singlePurchaseSetting?.setting_value as any)?.platform_percentage || 30;
  const authorPercentage = (singlePurchaseSetting?.setting_value as any)?.author_percentage || 70;

  const platformEarnings = totalRevenue * (platformPercentage / 100);
  const authorEarnings = totalRevenue * (authorPercentage / 100);

  // Chart data - Revenue by type
  const revenueByType = [
    { name: 'Compras', value: purchaseRevenue, color: COLORS[0] },
    { name: 'Sub. Mensual', value: monthlySubRevenue, color: COLORS[1] },
    { name: 'Sub. Anual', value: annualSubRevenue, color: COLORS[2] },
    { name: 'Donaciones', value: donationsRevenue, color: COLORS[3] },
  ];

  // Chart data - Earnings distribution
  const earningsDistribution = [
    { name: 'Plataforma', value: platformEarnings, color: COLORS[2] },
    { name: 'Usuarios (Pozo)', value: authorEarnings, color: COLORS[3] },
  ];

  // Chart data - Daily revenue (last 7 days)
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    
    const dayPurchases = purchases?.filter(p => 
      format(new Date(p.created_at), 'yyyy-MM-dd') === dayStr
    ).reduce((acc, p) => acc + Number(p.amount), 0) || 0;
    
    const daySubs = subscriptions?.filter(s => 
      format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
    ).reduce((acc, s) => acc + Number(s.amount), 0) || 0;

    return {
      date: format(date, 'dd MMM', { locale: es }),
      compras: dayPurchases,
      suscripciones: daySubs,
      total: dayPurchases + daySubs
    };
  });

  // Payment methods breakdown
  const paymentMethods = purchases?.reduce((acc, p) => {
    const method = p.payment_method || 'Desconocido';
    acc[method] = (acc[method] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>) || {};

  const paymentMethodsData = Object.entries(paymentMethods).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length]
  }));

  if (isLoading) {
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin')}
            className="text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_hsl(180,100%,50%)]">
              Estadísticas de Ventas
            </h1>
            <p className="text-muted-foreground mt-1">
              Movimientos de dinero y análisis de ventas de la plataforma
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos {dateRange} días
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancias Plataforma
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                ${platformEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformPercentage}% de las ventas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Compras
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {totalPurchases}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${purchaseRevenue.toFixed(2)} en ventas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Donaciones
              </CardTitle>
              <Heart className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                {totalDonations}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${donationsRevenue.toFixed(2)} recaudados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards - Row 2: Subscriptions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suscripciones Mensuales
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {monthlySubscriptions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${monthlySubRevenue.toFixed(2)} en ventas mensuales
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suscripciones Anuales
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {annualSubscriptions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${annualSubRevenue.toFixed(2)} en ventas anuales
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Suscripciones
              </CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                {totalSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${subscriptionRevenue.toFixed(2)} total suscripciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Daily Revenue Chart */}
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Ingresos Diarios</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="compras" stroke={COLORS[0]} strokeWidth={2} name="Compras" />
                    <Line type="monotone" dataKey="suscripciones" stroke={COLORS[1]} strokeWidth={2} name="Suscripciones" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Distribución de Ingresos</CardTitle>
              <CardDescription>Por tipo de transacción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Split & Payment Methods */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Platform vs Authors */}
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">División de Ganancias</CardTitle>
              <CardDescription>Plataforma vs Autores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {earningsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Métodos de Pago</CardTitle>
              <CardDescription>Distribución por método</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {paymentMethodsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sin datos de métodos de pago
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Subscriptions Table */}
        <Card className="bg-card/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Suscripciones Recientes
            </CardTitle>
            <CardDescription>Historial de suscripciones vendidas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.slice(0, 10).map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className={
                        sub.plan_type === 'annual' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      }>
                        {sub.plan_type === 'annual' ? 'Anual' : 'Mensual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sub.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.payment_provider}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={sub.status === 'active' ? 'default' : 'destructive'}
                        className={sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                      >
                        {sub.status === 'active' ? 'Activa' : sub.status === 'cancelled' ? 'Cancelada' : sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(sub.current_period_start), 'dd/MM/yy')} - {format(new Date(sub.current_period_end), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell className="text-right font-medium text-cyan-400">
                      ${Number(sub.amount).toFixed(2)} {sub.currency}
                    </TableCell>
                  </TableRow>
                ))}
                {(!subscriptions || subscriptions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay suscripciones en este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="bg-card/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Últimas Compras de Contenido
            </CardTitle>
            <CardDescription>Historial de compras recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.slice(0, 10).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(purchase.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(purchase.content_uploads as any)?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {purchase.purchase_type === 'rental' ? 'Alquiler' : 'Compra'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {purchase.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={purchase.status === 'completed' ? 'default' : 'destructive'}
                        className={purchase.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                      >
                        {purchase.status === 'completed' ? 'Completado' : purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-cyan-400">
                      ${Number(purchase.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!purchases || purchases.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay transacciones en este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SalesAnalytics;