[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/digital-asset/daml/blob/main/LICENSE)

# DAML data-driven asset

Future categories of tokenized assets may encapsulate data from enterprise systems to support various types of financing.

While today's unsecured bonds may depend on audited financial systems, asset-specific data from deterministic sources may provide greater detail about a company's performance in a specific area.

This example of DAML workflow shows a mock enterprise data stream certified by an auditor for support of a digital asset created by a bank.  

## Extending create-daml-app

Start the Daml components in root directory (build first, if necessary):

```bash
daml start
```

Then, start the JS dev server:

```bash
cd ui
npm install
npm start
```

Open 3 browser tabs and navigate to localhost:3000 on each.

Log in as 
- enterprise
- bank
- auditor

Only the Enterprise tab will show four buttons: 

1) Start - create instances of Enterprise, Bank and Auditor templates
2) Data - create an instance of DataStream template and associate mock event data
3) Certify - certify the data stream
4) Asset - create an instance of Asset template, then assign data stream

As Enterprise, follow Bank and Auditor.

As Bank, follow Enterprise.

As Auditor, follow Enterprise.


To run the mock workflow from the Enterprise tab, click the 4 buttons in sequence, waiting a second or two after clicking each one.

## Notes

The messaging can be more comprehensive and programmatic, especially with regard to domains and interoperability.

The relationship between the DataStream template and stringified events has been simplified to deal with Daml-LF JSON issues. Ideally, the entire DataStream object would be encoded and decoded using Daml-LF techniques.

Need better/more appropriate use of usernames.
A particular tab may freeze if inactive and/or switched out for too long.

Logouts are not archived



