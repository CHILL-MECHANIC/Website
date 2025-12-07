POST https://api.uniquedigitaloutreach.com/v1/sms

Payload
{
  "sender": "senderName",
  "to": "91XXXXXXXXXX",
  "text": "Hello World!",
  "type": "TRANS"
}

cURL:

  curl -G - /v1/sms \
  -H 'Content-Type': 'application/json'\
  -H 'apikey':'string'
  -d {
    'sender':'senderName' \
    'to' :'91XXXXXXXXXX' \
    'text' : 'Hello, World!' \
    'type' :'OTP'\

  }

RESPONSE:
{
  "id": "58d63c02-XXXX-XXXX-XXXX-XXXXbb39453",
  "data": [
    {
    "recipient": "91XXXXXXXXXX",
    "messageId": "58d63c02-XXXXX-XXXXX-XXXXX-XXXX9bb39453:1"
    }
],
  "totalCount": 1,
  "message": "Message Sent Successfully!",
  "error": null
}
