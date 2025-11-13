import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useBulkSMS } from '@/hooks/useBulkSMS';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Upload } from 'lucide-react';
import type { SMSType } from '@/services/smsClient';

/**
 * BulkSMSForm Component
 * Form for sending bulk SMS to multiple recipients
 */
export function BulkSMSForm() {
  const { sendBulkSMS, loading, error, response, reset } = useBulkSMS();
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SMSType>('TRANS');
  const [senderId, setSenderId] = useState('');
  const [unicode, setUnicode] = useState(false);
  const [flash, setFlash] = useState(false);

  // Parse recipients from text input (comma, newline, or space separated)
  const parseRecipients = (text: string): string[] => {
    return text
      .split(/[,\n\s]+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
  };

  const recipientList = parseRecipients(recipients);
  const recipientCount = recipientList.length;
  const maxRecipients = 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientCount === 0 || !message.trim()) {
      return;
    }

    if (recipientCount > maxRecipients) {
      return;
    }

    await sendBulkSMS({
      recipients: recipientList,
      message: message.trim(),
      type,
      senderId: senderId.trim() || undefined,
      unicode,
      flash
    });
  };

  const handleReset = () => {
    setRecipients('');
    setMessage('');
    setType('TRANS');
    setSenderId('');
    setUnicode(false);
    setFlash(false);
    reset();
  };

  const messageLength = message.length;
  const isMessageValid = messageLength > 0 && messageLength <= 1600;
  const isRecipientsValid = recipientCount > 0 && recipientCount <= maxRecipients;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Bulk SMS</CardTitle>
        <CardDescription>Send SMS to multiple recipients at once (max {maxRecipients})</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <Textarea
              id="recipients"
              placeholder="Enter phone numbers separated by commas or newlines&#10;+911234567890, +919876543210&#10;+911111111111"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              required
              disabled={loading}
              rows={4}
            />
            <div className="flex justify-between items-center text-xs">
              <span className={isRecipientsValid ? 'text-muted-foreground' : 'text-destructive'}>
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </span>
              {!isRecipientsValid && recipientCount > maxRecipients && (
                <span className="text-destructive">Maximum {maxRecipients} recipients allowed</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format: E.164 (e.g., +911234567890). Separate multiple numbers with commas or newlines.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={loading}
              rows={5}
              maxLength={1600}
            />
            <div className="flex justify-between text-xs">
              <span className={isMessageValid ? 'text-muted-foreground' : 'text-destructive'}>
                {messageLength} / 1600 characters
              </span>
              {!isMessageValid && messageLength > 0 && (
                <span className="text-destructive">Message too long</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">SMS Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as SMSType)} disabled={loading}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANS">Transactional</SelectItem>
                  <SelectItem value="PROMO">Promotional</SelectItem>
                  <SelectItem value="OTP">OTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderId">Sender ID (Optional)</Label>
              <Input
                id="senderId"
                type="text"
                placeholder="SMS"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                disabled={loading}
                maxLength={50}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unicode"
                checked={unicode}
                onChange={(e) => setUnicode(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="unicode" className="cursor-pointer">
                Unicode (for special characters)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="flash"
                checked={flash}
                onChange={(e) => setFlash(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="flash" className="cursor-pointer">
                Flash SMS
              </Label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {response?.success && response.data && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    Bulk SMS completed: <strong>{response.data.success}</strong> sent,{' '}
                    <strong>{response.data.failed}</strong> failed out of {response.data.total} total
                  </p>
                  {response.data.failed > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold">Failed recipients:</p>
                      {response.data.results
                        .filter(r => !r.success)
                        .slice(0, 5)
                        .map((r, idx) => (
                          <div key={idx} className="text-xs">
                            {r.recipient}: {r.error}
                          </div>
                        ))}
                      {response.data.results.filter(r => !r.success).length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... and {response.data.results.filter(r => !r.success).length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {response && !response.success && !error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {response.error || 'Failed to send bulk SMS'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || recipientCount === 0 || !message.trim() || !isMessageValid || !isRecipientsValid}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Send Bulk SMS
                </>
              )}
            </Button>
            {(response || error) && (
              <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

