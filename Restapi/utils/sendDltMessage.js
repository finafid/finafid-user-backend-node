const axios = require('axios');


const payload = {
    keyword: 'DEMO',
    timeStamp: '27102031163530',
    dataSet: [
        {
            UNIQUE_ID: '735694wew',
            MESSAGE: 'Test Message',
            OA: 'DEMO',
            MSISDN: 'xxxxxxxx',
            CHANNEL: 'SMS',
            CAMPAIGN_NAME: 'finafid_ht',
            CIRCLE_NAME: 'DLT_SERVICE_IMPLICT',
            USER_NAME: 'finafid_siht1',
            DLT_TM_ID: '1001096933494158',
            DLT_CT_ID: '123456',
            DLT_PE_ID: '1001751517438613463',
            LANG_ID: '0'
        }
    ]
};

// Make a POST request to the Airtel DLT API endpoint
axios.post('https://digimate.airtel.in:44111/BulkPush/InstantJsonPush', payload)
    .then(response => {
        console.log('Message sent successfully:', response.data);
    })
    .catch(error => {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    });
