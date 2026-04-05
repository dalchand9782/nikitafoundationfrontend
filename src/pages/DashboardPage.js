import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentActivities, getDailyCollections } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  IndianRupee,
  Clock,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Wallet
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState({ total: 0, count: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          getDashboardStats(),
          getRecentActivities()
        ]);
        setStats(statsRes.data);
        setRecentLoans(recentRes.data.recent_loans || []);
        
        // Fetch collector's own daily collection
        if (user?.id) {
          try {
            const collectionRes = await getDailyCollections({ collector_id: user.id });
            setMyCollection({
              total: collectionRes.data.total_collected || 0,
              count: collectionRes.data.total_emis || 0
            });
          } catch (e) {
            console.error('Failed to fetch my collection:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleStatClick = (type) => {
    switch(type) {
      case 'total':
        navigate('/loans?status=all');
        break;
      case 'running':
        navigate('/loans?status=running');
        break;
      case 'closed':
        navigate('/loans?status=closed');
        break;
      case 'due':
        navigate('/loans?status=due');
        break;
      default:
        break;
    }
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      clickable: true,
      type: 'total'
    },
    {
      title: 'Running Loans',
      value: stats?.running_applications || 0,
      icon: TrendingUp,
      color: 'bg-forest-500',
      textColor: 'text-forest-600',
      bgColor: 'bg-forest-50',
      clickable: true,
      type: 'running'
    },
    {
      title: 'Closed Loans',
      value: stats?.closed_applications || 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      clickable: true,
      type: 'closed'
    },
    {
      title: 'Due EMI Loans',
      value: stats?.due_emi_applications || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      clickable: true,
      type: 'due',
      highlight: (stats?.due_emi_applications || 0) > 0
    },
  ];

  const amountCards = [
    {
      title: 'Total Loan Amount',
      value: formatCurrency(stats?.total_loan_amount),
      icon: IndianRupee,
      textColor: 'text-forest-600',
      bgColor: 'bg-forest-50'
    },
    {
      title: 'Pending EMI',
      value: formatCurrency(stats?.pending_emi_amount),
      icon: Clock,
      textColor: 'text-terracotta-600',
      bgColor: 'bg-terracotta-50'
    },
    {
      title: 'Total Collected',
      value: formatCurrency(stats?.total_collected),
      icon: CheckCircle2,
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Today\'s Collection',
      value: formatCurrency(stats?.today_collected),
      subtitle: `${stats?.today_emi_count || 0} EMIs`,
      icon: Calendar,
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-800">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-stone-500 mt-1">Here's what's happening with your loans today.</p>
        </div>
        {isAdmin && (
          <Link to="/loans/create">
            <Button className="bg-forest-500 hover:bg-forest-600" data-testid="create-loan-button">
              <Plus className="h-4 w-4 mr-2" />
              New Loan
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="dashboard-stats">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`border-stone-200 card-hover cursor-pointer animate-fade-in transition-all ${
              stat.highlight ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => stat.clickable && handleStatClick(stat.type)}
            data-testid={`stat-${stat.type}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300" />
              </div>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-stone-500 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Amount Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {amountCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="border-stone-200 animate-fade-in"
            style={{ animationDelay: `${(index + 4) * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
              </div>
              <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-stone-400">{stat.subtitle}</p>
              )}
              <p className="text-xs text-stone-500 mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Due EMI Alert */}
      {(stats?.due_emi_applications || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">
                    {stats?.due_emi_applications} Loan(s) with Overdue EMI
                  </p>
                  <p className="text-sm text-red-600">
                    These loans have EMIs that were due yesterday or earlier
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/loans?status=due')}
                className="bg-red-500 hover:bg-red-600"
                data-testid="view-due-emis"
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Collection Today (for Collectors) */}
      <Card className="border-forest-200 bg-gradient-to-r from-forest-50 to-forest-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-forest-500 flex items-center justify-center">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-forest-600 font-medium">
                  {isAdmin ? "Today's Total Collection" : "My Collection Today"}
                </p>
                <p className="text-3xl font-bold text-forest-700">
                  {formatCurrency(isAdmin ? stats?.today_collected : myCollection.total)}
                </p>
                <p className="text-sm text-forest-500">
                  {isAdmin ? stats?.today_emi_count : myCollection.count} EMIs collected
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/emi')}
              className="bg-forest-500 hover:bg-forest-600"
            >
              Collect EMI
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Loans */}
      <Card className="border-stone-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-heading text-lg">Recent Loans</CardTitle>
          <Link to="/loans">
            <Button variant="ghost" size="sm" className="text-forest-600 hover:text-forest-700">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentLoans.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-stone-300" />
              <p>No loans yet</p>
              {isAdmin && (
                <Link to="/loans/create">
                  <Button className="mt-4 bg-forest-500 hover:bg-forest-600" size="sm">
                    Create First Loan
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentLoans.map((loan) => (
                <Link 
                  key={loan.id} 
                  to={`/loans/${loan.id}`}
                  className="block"
                  data-testid={`recent-loan-${loan.id}`}
                >
                  <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{loan.borrower_name}</p>
                      <p className="text-sm text-stone-500">{loan.application_number}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-stone-800">{formatCurrency(loan.loan_amount)}</p>
                      <Badge 
                        variant={loan.status === 'running' ? 'default' : 'secondary'}
                        className={loan.status === 'running' ? 'bg-forest-100 text-forest-700' : 'bg-stone-100 text-stone-600'}
                      >
                        {loan.status === 'running' ? 'Running' : 'Closed'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
