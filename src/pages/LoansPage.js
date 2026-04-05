import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLoans, searchLoans } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Search, 
  Plus, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle
} from 'lucide-react';

export default function LoansPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchLoans = useCallback(async (status = 'all', page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20
      };
      
      if (status === 'due') {
        params.due_only = true;
      } else if (status !== 'all') {
        params.status = status;
      }
      
      const response = await getLoans(params);
      setLoans(response.data.loans || []);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.total_pages
      });
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    setActiveTab(status);
    fetchLoans(status, 1);
  }, [searchParams, fetchLoans]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchLoans(activeTab, 1);
      return;
    }

    setLoading(true);
    try {
      const response = await searchLoans(searchQuery);
      setLoans(response.data.loans || []);
      setPagination({ page: 1, limit: 20, total: response.data.loans?.length || 0, totalPages: 1 });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ status: value });
    setSearchQuery('');
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchLoans(activeTab, newPage);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-800">
            Loan Applications
          </h1>
          <p className="text-stone-500 mt-1">Manage and track all loan applications</p>
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

      {/* Search */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search by Application No, Name or Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                data-testid="loan-search-input"
              />
            </div>
            <Button type="submit" className="bg-forest-500 hover:bg-forest-600" data-testid="loan-search-button">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-stone-100 flex-wrap h-auto p-1">
          <TabsTrigger value="all" data-testid="tab-all" className="flex-1 min-w-[80px]">All</TabsTrigger>
          <TabsTrigger value="running" data-testid="tab-running" className="flex-1 min-w-[80px]">Running</TabsTrigger>
          <TabsTrigger value="closed" data-testid="tab-closed" className="flex-1 min-w-[80px]">Closed</TabsTrigger>
          <TabsTrigger value="due" data-testid="tab-due" className="flex-1 min-w-[80px] text-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Due
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="border-stone-200">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                {activeTab === 'due' ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <FileText className="h-5 w-5 text-forest-600" />
                )}
                {activeTab === 'all' ? 'All Applications' : 
                 activeTab === 'running' ? 'Running Loans' : 
                 activeTab === 'closed' ? 'Closed Loans' : 'Overdue EMI Loans'}
                <Badge variant="secondary" className="ml-2">{pagination.total}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-stone-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-stone-300" />
                  <p className="text-lg font-medium">No loans found</p>
                  <p className="text-sm mt-1">
                    {searchQuery ? 'Try a different search term' : 'Create a new loan to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loans.map((loan) => (
                    <Link 
                      key={loan.id} 
                      to={`/loans/${loan.id}`}
                      className="block"
                      data-testid={`loan-item-${loan.id}`}
                    >
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-colors gap-3 ${
                        loan.due_emi_count > 0 ? 'bg-red-50 hover:bg-red-100 border border-red-200' : 'bg-stone-50 hover:bg-stone-100'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-stone-800">{loan.borrower_name}</p>
                            <Badge 
                              variant={loan.status === 'running' ? 'default' : 'secondary'}
                              className={loan.status === 'running' ? 'bg-forest-100 text-forest-700' : 'bg-stone-200 text-stone-600'}
                            >
                              {loan.status === 'running' ? 'Running' : 'Closed'}
                            </Badge>
                            {loan.due_emi_count > 0 && (
                              <Badge variant="destructive" className="bg-red-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {loan.due_emi_count} Overdue
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-stone-500">
                            <span>{loan.application_number}</span>
                            <span>{loan.borrower_mobile}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <p className="font-bold text-stone-800">{formatCurrency(loan.loan_amount)}</p>
                            <p className="text-xs text-stone-500">
                              EMI: {loan.paid_emi}/{loan.total_emi}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-forest-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    data-testid="prev-page-button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-stone-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    data-testid="next-page-button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
