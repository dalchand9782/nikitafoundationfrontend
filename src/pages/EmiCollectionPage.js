import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLoans, markEmiPaid, getLoan, formatApiError, getDailyCollections } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Search, 
  CreditCard,
  CheckCircle2,
  User,
  Phone,
  IndianRupee,
  Eye,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  X
} from 'lucide-react';

export default function EmiCollectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [includePenalty, setIncludePenalty] = useState(true);
  const [todayCollection, setTodayCollection] = useState({ total: 0, count: 0 });

  useEffect(() => {
    // Fetch today's collection for the collector
    const fetchTodayCollection = async () => {
      try {
        const response = await getDailyCollections({ collector_id: user?.id });
        setTodayCollection({
          total: response.data.total_collected || 0,
          count: response.data.total_emis || 0
        });
      } catch (error) {
        console.error('Failed to fetch today collection:', error);
      }
    };
    if (user?.id) {
      fetchTodayCollection();
    }
  }, [user?.id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    setSelectedLoan(null);
    setLoanDetails(null);
    try {
      const response = await searchLoans(searchQuery);
      setSearchResults(response.data.loans || []);
      if (response.data.loans?.length === 0) {
        toast.info('No loans found');
      }
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLoan = async (loan) => {
    if (loan.status === 'closed') {
      toast.info('This loan is already closed');
      return;
    }
    
    setLoading(true);
    setSelectedLoan(loan);
    try {
      const response = await getLoan(loan.id);
      setLoanDetails(response.data.loan);
    } catch (error) {
      toast.error(formatApiError(error));
      setSelectedLoan(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePayEmi = async () => {
    if (!selectedEmi || !loanDetails) return;

    setPaymentLoading(true);
    try {
      const response = await markEmiPaid({
        application_id: loanDetails.id,
        emi_no: selectedEmi.emi_no,
        amount: loanDetails.emi_amount,
        include_penalty: selectedEmi.is_overdue && includePenalty
      });
      
      toast.success(`EMI #${selectedEmi.emi_no} marked as paid! Total: ₹${response.data.total_amount}`);
      setPaymentDialogOpen(false);
      setSelectedEmi(null);
      
      // Refresh loan details
      const loanResponse = await getLoan(loanDetails.id);
      setLoanDetails(loanResponse.data.loan);
      
      // Update today's collection
      setTodayCollection(prev => ({
        total: prev.total + response.data.total_amount,
        count: prev.count + 1
      }));
      
      // Update search results
      setSearchResults(prev => prev.map(l => 
        l.id === loanDetails.id 
          ? { ...l, paid_emi: response.data.paid_emi, remaining_emi: response.data.remaining_emi, status: response.data.status }
          : l
      ));
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Today's Collection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-800">
            EMI Collection
          </h1>
          <p className="text-stone-500 mt-1">Search for a loan and mark EMI as paid</p>
        </div>
        
        {/* Today's Collection Card */}
        <Card className="border-forest-200 bg-forest-50 sm:min-w-[200px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-forest-600" />
              </div>
              <div>
                <p className="text-xs text-forest-600 font-medium">Today's Collection</p>
                <p className="text-xl font-bold text-forest-700">{formatCurrency(todayCollection.total)}</p>
                <p className="text-xs text-forest-500">{todayCollection.count} EMIs collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-forest-600" />
            Search Loan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search by Application No, Name or Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
                data-testid="emi-search-input"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-forest-500 hover:bg-forest-600 h-12 px-6"
              disabled={loading}
              data-testid="emi-search-button"
            >
              {loading && !selectedLoan ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* EMI Schedule View (when loan is selected) */}
      {loanDetails && (
        <Card className="border-stone-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setSelectedLoan(null);
                    setLoanDetails(null);
                  }}
                  data-testid="back-to-search"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="font-heading text-lg">{loanDetails.borrower_name}</CardTitle>
                  <p className="text-sm text-stone-500">{loanDetails.application_number}</p>
                </div>
              </div>
              <Badge 
                variant={loanDetails.status === 'running' ? 'default' : 'secondary'}
                className={loanDetails.status === 'running' ? 'bg-forest-500' : 'bg-stone-500'}
              >
                {loanDetails.status === 'running' ? 'Running' : 'Closed'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Loan Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-stone-50 rounded-xl">
              <div>
                <p className="text-xs text-stone-500">Loan Amount</p>
                <p className="font-bold text-forest-600">{formatCurrency(loanDetails.loan_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">EMI Amount</p>
                <p className="font-bold text-stone-800">{formatCurrency(loanDetails.emi_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Paid EMIs</p>
                <p className="font-bold text-green-600">{loanDetails.paid_emi}/{loanDetails.total_emi}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Penalty</p>
                <p className="font-bold text-red-600">{formatCurrency(loanDetails.emi_penalty_amount || 100)}</p>
              </div>
            </div>

            {/* EMI Schedule */}
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-forest-600" />
              EMI Schedule
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(loanDetails.emi_schedule || []).map((emi) => {
                const isPaid = emi.status === 'paid';
                const isOverdue = emi.is_overdue && !isPaid;
                
                return (
                  <div 
                    key={emi.emi_no}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isPaid 
                        ? 'bg-green-50 border border-green-200' 
                        : isOverdue 
                          ? 'bg-red-50 border border-red-200' 
                          : 'bg-stone-50 border border-stone-200'
                    }`}
                    data-testid={`emi-row-${emi.emi_no}`}
                  >
                    {/* EMI Number */}
                    <div className="w-16 sm:w-20">
                      <span className={`font-bold text-sm ${isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-stone-700'}`}>
                        EMI #{emi.emi_no}
                      </span>
                    </div>
                    
                    {/* Due Date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Calendar className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-stone-400'}`} />
                        <span className={`text-xs sm:text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-600'}`}>
                          {formatDate(emi.due_date)}
                        </span>
                      </div>
                      {isPaid && emi.collected_by && (
                        <p className="text-xs text-green-600 mt-0.5">
                          by {emi.collected_by}
                        </p>
                      )}
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right min-w-[80px] sm:min-w-[120px]">
                      {isOverdue ? (
                        <div>
                          <span className="text-red-600 font-bold text-sm sm:text-base">
                            ₹{loanDetails.emi_amount}+<span className="text-red-700">{loanDetails.emi_penalty_amount || 100}</span>
                          </span>
                        </div>
                      ) : (
                        <span className={`font-bold text-sm sm:text-base ${isPaid ? 'text-green-600' : 'text-stone-700'}`}>
                          ₹{emi.total_paid || loanDetails.emi_amount}
                        </span>
                      )}
                    </div>
                    
                    {/* Action */}
                    <div className="flex items-center gap-1">
                      {isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : loanDetails.status === 'running' ? (
                        <Button
                          size="sm"
                          className={`text-xs ${isOverdue ? 'bg-red-500 hover:bg-red-600' : 'bg-forest-500 hover:bg-forest-600'}`}
                          onClick={() => {
                            setSelectedEmi(emi);
                            setIncludePenalty(true);
                            setPaymentDialogOpen(true);
                          }}
                          data-testid={`pay-emi-${emi.emi_no}`}
                        >
                          Pay
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Closed</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results (when no loan is selected) */}
      {!loanDetails && searchResults.length > 0 && (
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Search Results
              <Badge variant="secondary" className="ml-2">{searchResults.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((loan) => (
                <div 
                  key={loan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors gap-3"
                  data-testid={`emi-loan-item-${loan.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <User className="h-4 w-4 text-stone-400" />
                      <p className="font-semibold text-stone-800">{loan.borrower_name}</p>
                      <Badge 
                        variant={loan.status === 'running' ? 'default' : 'secondary'}
                        className={loan.status === 'running' ? 'bg-forest-100 text-forest-700' : 'bg-stone-200 text-stone-600'}
                      >
                        {loan.status === 'running' ? 'Running' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                      <span>{loan.application_number}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {loan.borrower_mobile}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-forest-600">{formatCurrency(loan.loan_amount)}</p>
                      <p className="text-xs text-stone-500">
                        EMI: {loan.paid_emi || 0}/{loan.total_emi || 100}
                      </p>
                    </div>
                    {loan.status === 'running' && (
                      <Button 
                        className="bg-forest-500 hover:bg-forest-600"
                        onClick={() => handleSelectLoan(loan)}
                        data-testid={`select-loan-${loan.id}`}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay EMI
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {!loanDetails && searchResults.length === 0 && searchQuery && !loading && (
        <Card className="border-stone-200">
          <CardContent className="py-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-stone-300" />
            <p className="text-lg font-medium text-stone-600">No loans found</p>
            <p className="text-sm text-stone-500 mt-1">Try a different search term</p>
          </CardContent>
        </Card>
      )}

      {!loanDetails && searchResults.length === 0 && !searchQuery && (
        <Card className="border-stone-200">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-stone-300" />
            <p className="text-lg font-medium text-stone-600">Search for a loan</p>
            <p className="text-sm text-stone-500 mt-1">
              Enter application number, name, or mobile to find a loan
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirm EMI Payment</DialogTitle>
          </DialogHeader>
          {selectedEmi && loanDetails && (
            <div className="py-4">
              <p className="text-stone-600 mb-4">
                You are about to mark EMI #{selectedEmi.emi_no} as paid for:
              </p>
              <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                <p className="font-semibold text-stone-800">{loanDetails.borrower_name}</p>
                <p className="text-sm text-stone-500">{loanDetails.application_number}</p>
                <div className="border-t border-stone-200 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>EMI Amount:</span>
                    <span>₹{loanDetails.emi_amount}</span>
                  </div>
                  {selectedEmi.is_overdue && (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                          id="penalty"
                          checked={includePenalty}
                          onCheckedChange={setIncludePenalty}
                        />
                        <label htmlFor="penalty" className="text-sm text-red-600 font-medium cursor-pointer">
                          Include Penalty: ₹{loanDetails.emi_penalty_amount || 100}
                        </label>
                      </div>
                      <p className="text-xs text-red-500 mt-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        This EMI is overdue
                      </p>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t border-stone-200">
                    <span>Total:</span>
                    <span className="text-forest-600">
                      ₹{loanDetails.emi_amount + (selectedEmi.is_overdue && includePenalty ? (loanDetails.emi_penalty_amount || 100) : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} data-testid="cancel-emi-payment">
              Cancel
            </Button>
            <Button 
              onClick={handlePayEmi} 
              disabled={paymentLoading}
              className="bg-forest-500 hover:bg-forest-600"
              data-testid="confirm-emi-payment"
            >
              {paymentLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
