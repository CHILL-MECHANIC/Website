import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SMSForm } from '@/components/SMSForm';
import { BulkSMSForm } from '@/components/BulkSMSForm';
import { SMSLogsViewer } from '@/components/SMSLogsViewer';

/**
 * SMS Management Page
 * Provides interface for sending SMS and viewing logs
 */
export default function SMS() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-muted-foreground mt-2">
          Send SMS messages and manage your SMS history
        </p>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Send SMS</TabsTrigger>
          <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
          <TabsTrigger value="logs">SMS Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <SMSForm />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkSMSForm />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <SMSLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

