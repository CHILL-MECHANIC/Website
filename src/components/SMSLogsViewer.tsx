import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSMSLogs } from '@/hooks/useSMSLogs';
import { Loader2, RefreshCw, Search, XCircle, CheckCircle2, Clock, AlertCircle, RotateCw } from 'lucide-react';
import type { SMSStatus, SMSType } from '@/services/smsClient';
import { format } from 'date-fns';

/**
 * SMSLogsViewer Component
 * Displays SMS logs with filtering, pagination, and resend functionality
 */
export function SMSLogsViewer() {
  const { logs, loading, error, total, hasMore, fetchLogs, resendFailedSMS } = useSMSLogs();
  const [recipientFilter, setRecipientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<SMSStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SMSType | 'all'>('all');
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const [resending, setResending] = useState<number | null>(null);
  const limit = 20;

  useEffect(() => {
    fetchLogs({
      recipient: recipientFilter || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit,
      offset: 0
    });
    setOffset(0);
  }, [recipientFilter, statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    fetchLogs({
      recipient: recipientFilter || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit,
      offset: newOffset
    });
    setOffset(newOffset);
  };

  const handleRefresh = () => {
    fetchLogs({
      recipient: recipientFilter || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit,
      offset: 0
    });
    setOffset(0);
  };

  const handleResend = async (id: number) => {
    setResending(id);
    const success = await resendFailedSMS(id);
    setResending(null);
    if (success) {
      handleRefresh();
    }
  };

  const getStatusBadge = (status: SMSStatus) => {
    const variants: Record<SMSStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
      sent: { variant: 'default', icon: CheckCircle2 },
      delivered: { variant: 'default', icon: CheckCircle2 },
      pending: { variant: 'secondary', icon: Clock },
      failed: { variant: 'destructive', icon: XCircle }
    };

    const { variant, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type?: SMSType) => {
    if (!type) return null;
    return <Badge variant="outline">{type}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SMS Logs</CardTitle>
            <CardDescription>View and manage SMS sending history</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-filter">Recipient</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient-filter"
                  placeholder="Filter by phone number"
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SMSStatus | 'all')}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as SMSType | 'all')}>
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="TRANS">Transactional</SelectItem>
                  <SelectItem value="PROMO">Promotional</SelectItem>
                  <SelectItem value="OTP">OTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No SMS logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                      <TableCell>{getTypeBadge(log.type)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.retryCount} / {log.maxRetries}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLog(log.id)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>SMS Log Details</DialogTitle>
                                <DialogDescription>Complete information about this SMS</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">ID</Label>
                                    <p className="font-mono text-sm">{log.id}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Recipient</Label>
                                    <p className="font-mono text-sm">{log.recipient}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div>{getStatusBadge(log.status)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Type</Label>
                                    <div>{getTypeBadge(log.type)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Message ID</Label>
                                    <p className="font-mono text-sm">{log.messageId || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Retries</Label>
                                    <p className="text-sm">
                                      {log.retryCount} / {log.maxRetries}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Created</Label>
                                    <p className="text-sm">
                                      {format(new Date(log.createdAt), 'PPpp')}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Updated</Label>
                                    <p className="text-sm">
                                      {format(new Date(log.updatedAt), 'PPpp')}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Message</Label>
                                  <p className="text-sm p-2 bg-muted rounded-md">{log.message}</p>
                                </div>
                                {log.apiResponse && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">API Response</Label>
                                    <pre className="text-xs p-2 bg-muted rounded-md overflow-auto max-h-48">
                                      {JSON.stringify(log.apiResponse, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {log.status === 'failed' && log.retryCount < log.maxRetries && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResend(log.id)}
                              disabled={resending === log.id}
                            >
                              {resending === log.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} of {total} logs
            </p>
            {hasMore && (
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

