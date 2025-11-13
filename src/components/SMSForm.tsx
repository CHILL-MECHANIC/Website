import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSMS } from '@/hooks/useSMS';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { SMSType } from '@/services/smsClient';

/**
 * SMSForm Component
 * Form for sending a single SMS with validation and error handling
 */
export function SMSForm() {
  const { sendSMS, loading, error, response, reset } = useSMS();
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SMSType>('TRANS');
  const [senderId, setSenderId] = useState('');
  const [unicode, setUnicode] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient.trim() || !message.trim()) {
      return;
    }

    await sendSMS({
      recipient: recipient.trim(),
      message: message.trim(),
      type,
      senderId: senderId.trim() || undefined,
      unicode,
      flash
    });
  };

  const handleReset = () => {
    setRecipient('');
    setMessage('');
    setType('TRANS');
    setSenderId('');
    setUnicode(false);
    setFlash(false);
    reset();
  };

  const messageLength = message.length;
  const isMessageValid = messageLength > 0 && messageLength <= 1600;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send SMS</CardTitle>
        <CardDescription>Send a single SMS message to a recipient</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Phone Number</Label>
            <Input
              id="recipient"
              type="tel"
              placeholder="+911234567890"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Format: E.164 (e.g., +911234567890)
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

          {response?.success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                SMS sent successfully! Message ID: {response.data?.messageId || 'N/A'}
              </AlertDescription>
            </Alert>
          )}

          {response && !response.success && !error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {response.error || 'Failed to send SMS'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !recipient.trim() || !message.trim() || !isMessageValid}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send SMS'
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

