import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoan, markEmiPaid, formatApiError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '../lib/api';
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  UserCheck,
  History,
  AlertTriangle,
  Edit,
  Trash2,
  Camera
} from 'lucide-react';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [includePenalty, setIncludePenalty] = useState(true);

  useEffect(() => {
    fetchLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLoan = async () => {
    try {
      const response = await getLoan(id);
      setLoan(response.data.loan);
    } catch (error) {
      console.error('Failed to fetch loan:', error);
      toast.error('Loan not found');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  const handlePayEmi = async () => {
    if (!selectedEmi) return;
    
    setPaymentLoading(true);
    try {
      const response = await markEmiPaid({
        application_id: id,
        emi_no: selectedEmi.emi_no,
        amount: loan.emi_amount,
        include_penalty: selectedEmi.is_overdue && includePenalty
      });
      
      toast.success(`EMI #${selectedEmi.emi_no} marked as paid! Total: ₹${response.data.total_amount}`);
      setPaymentDialogOpen(false);
      setSelectedEmi(null);
      
      // Refresh loan data
      fetchLoan();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteEmi = async () => {
    if (!selectedEmi) return;
    
    setPaymentLoading(true);
    try {
      await api.put('/emi/edit', {
        application_id: id,
        emi_no: selectedEmi.emi_no,
        action: 'delete'
      });
      
      toast.success(`EMI #${selectedEmi.emi_no} payment deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedEmi(null);
      fetchLoan();
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48"></div>
        <div className="h-64 bg-stone-100 rounded-2xl"></div>
        <div className="h-48 bg-stone-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!loan) {
    return null;
  }

  const progressPercentage = (loan.paid_emi / loan.total_emi) * 100;
  const emiSchedule = loan.emi_schedule || [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loans')} data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-800">
            {loan.application_number}
          </h1>
          <p className="text-stone-500">{loan.borrower_name}</p>
        </div>
        <Badge 
          variant={loan.status === 'running' ? 'default' : 'secondary'}
          className={`text-sm px-3 py-1 ${loan.status === 'running' ? 'bg-forest-500' : 'bg-stone-500'}`}
        >
          {loan.status === 'running' ? 'Running' : 'Closed'}
        </Badge>
      </div>

      {/* EMI Progress */}
      <Card className="border-stone-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg text-stone-800">EMI Progress</h3>
              <p className="text-stone-500 text-sm">
                {loan.paid_emi} of {loan.total_emi} EMIs paid
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-full ${
                loan.status === 'closed' ? 'bg-green-500' : 'bg-forest-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-stone-500">
              <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-500" />
              Paid: {loan.paid_emi}
            </span>
            <span className="text-stone-500">
              <Clock className="h-4 w-4 inline mr-1 text-terracotta-500" />
              Remaining: {loan.remaining_emi}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* EMI Schedule - Main Feature */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-forest-600" />
            EMI Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {emiSchedule.map((emi, index) => {
              const isPaid = emi.status === 'paid';
              const isOverdue = emi.is_overdue && !isPaid;
              const totalAmount = isOverdue 
                ? loan.emi_amount + (loan.emi_penalty_amount || 0)
                : loan.emi_amount;
              
              return (
                <div 
                  key={emi.emi_no}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    isPaid 
                      ? 'bg-green-50 border border-green-200' 
                      : isOverdue 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-stone-50 border border-stone-200'
                  }`}
                  data-testid={`emi-row-${emi.emi_no}`}
                >
                  {/* EMI Number */}
                  <div className="w-16 text-center">
                    <span className={`font-bold ${isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-stone-700'}`}>
                      EMI #{emi.emi_no}
                    </span>
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-stone-400'}`} />
                      <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-600'}`}>
                        {formatDate(emi.due_date)}
                      </span>
                    </div>
                    {isPaid && emi.collected_by && (
                      <p className="text-xs text-green-600 mt-1">
                        Paid by {emi.collected_by} on {formatDate(emi.paid_at)}
                      </p>
                    )}
                  </div>
                  
                  {/* Amount */}
                  <div className="text-right min-w-[120px]">
                    {isOverdue ? (
                      <div>
                        <span className="text-stone-500 line-through text-sm">₹{loan.emi_amount}</span>
                        <span className="text-red-600 font-bold ml-2">
                          ₹{loan.emi_amount}+<span className="text-red-700">{loan.emi_penalty_amount || 0}</span>
                        </span>
                      </div>
                    ) : (
                      <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-stone-700'}`}>
                        ₹{emi.total_paid || loan.emi_amount}
                      </span>
                    )}
                    {isPaid && emi.penalty_amount > 0 && (
                      <p className="text-xs text-red-500">(incl. ₹{emi.penalty_amount} penalty)</p>
                    )}
                  </div>
                  
                  {/* Action */}
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedEmi(emi);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`delete-emi-${emi.emi_no}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : loan.status === 'running' ? (
                      <Button
                        size="sm"
                        className={isOverdue ? 'bg-red-500 hover:bg-red-600' : 'bg-forest-500 hover:bg-forest-600'}
                        onClick={() => {
                          setSelectedEmi(emi);
                          setIncludePenalty(true);
                          setPaymentDialogOpen(true);
                        }}
                        data-testid={`pay-emi-${emi.emi_no}`}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Loan Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-forest-600" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Loan Amount</p>
                <p className="text-lg font-bold text-forest-600">{formatCurrency(loan.loan_amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Total Payable</p>
                <p className="text-lg font-bold text-stone-800">{formatCurrency(loan.total_payable_amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">EMI Amount</p>
                <p className="text-lg font-bold text-terracotta-600">{formatCurrency(loan.emi_amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Penalty Amount</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(loan.emi_penalty_amount || 100)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Start Date</p>
                <p className="text-lg font-semibold text-stone-800">{loan.borrow_date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Total EMIs</p>
                <p className="text-lg font-semibold text-stone-800">{loan.total_emi}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">Disbursement Name</p>
              <p className="text-stone-800">{loan.loan_disbursement_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Borrower Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-forest-600" />
              Borrower Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Borrower Photo */}
            {loan.borrower_photo && (
              <div className="flex justify-center mb-4">
                <img 
                  src={loan.borrower_photo} 
                  alt="Borrower" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-stone-200"
                />
              </div>
            )}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-800">{loan.borrower_name}</p>
                <p className="text-sm text-stone-500">S/o {loan.borrower_father_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-stone-400" />
              <p className="text-stone-800">{loan.borrower_mobile}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-stone-400" />
              <p className="text-stone-800">{loan.borrower_email}</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-stone-400 mt-0.5" />
              <p className="text-stone-800">{loan.borrower_address}</p>
            </div>
            {loan.borrower_signature && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Signature</p>
                <img src={loan.borrower_signature} alt="Borrower Signature" className="max-h-20 border rounded" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guarantor Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-forest-600" />
              Guarantor Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-800">{loan.guarantor_name}</p>
                <p className="text-sm text-stone-500">S/o {loan.guarantor_father_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-stone-400" />
              <p className="text-stone-800">{loan.guarantor_mobile}</p>
            </div>
            {loan.guarantor_signature && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-2">Signature</p>
                <img src={loan.guarantor_signature} alt="Guarantor Signature" className="max-h-20 border rounded" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* EMI History */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-forest-600" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loan.emi_history && loan.emi_history.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loan.emi_history.slice().reverse().map((emi, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-stone-800">EMI #{emi.emi_no}</p>
                      <p className="text-xs text-stone-500">
                        {formatDate(emi.paid_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(emi.total_amount || emi.amount)}</p>
                      {emi.penalty_amount > 0 && (
                        <p className="text-xs text-red-500">+₹{emi.penalty_amount} penalty</p>
                      )}
                      <p className="text-xs text-stone-500">by {emi.collected_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500">
                <History className="h-10 w-10 mx-auto mb-2 text-stone-300" />
                <p>No EMI payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirm EMI Payment</DialogTitle>
          </DialogHeader>
          {selectedEmi && (
            <div className="py-4">
              <p className="text-stone-600 mb-4">
                You are about to mark EMI #{selectedEmi.emi_no} as paid for:
              </p>
              <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                <p className="font-semibold text-stone-800">{loan.borrower_name}</p>
                <p className="text-sm text-stone-500">{loan.application_number}</p>
                <div className="border-t border-stone-200 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>EMI Amount:</span>
                    <span>₹{loan.emi_amount}</span>
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
                          Include Penalty: ₹{loan.emi_penalty_amount || 100}
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
                      ₹{loan.emi_amount + (selectedEmi.is_overdue && includePenalty ? (loan.emi_penalty_amount || 100) : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} data-testid="cancel-payment-button">
              Cancel
            </Button>
            <Button 
              onClick={handlePayEmi} 
              disabled={paymentLoading}
              className="bg-forest-500 hover:bg-forest-600"
              data-testid="confirm-payment-button"
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

      {/* Delete EMI Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete EMI Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will undo the payment for EMI #{selectedEmi?.emi_no}. This action is for correcting mistaken payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmi}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-delete-emi"
            >
              {paymentLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Delete Payment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
