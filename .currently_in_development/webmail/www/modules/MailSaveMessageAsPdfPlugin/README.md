# Aurora Mail save message As PDF plugin module

To enable this functionality, from [wkhtmltopdf](https://wkhtmltopdf.org/) website, download `wkhtmltopdf` package for your operating system. Install it and copy the library file under data/system directory, so the path looks like:

```
data/system/wkhtmltopdf/linux/wkhtmltopdf
```

or:

```
data/system/wkhtmltopdf/win/wkhtmltopdf.exe
```

NB: You need to make sure the file permissions are set correctly so that the library can be run from within PHP script.

Once it is done, you should be able to download message files and have them converted to PDF files on-the-fly.

# License
This module is licensed under AGPLv3 license if free version of the product is used or Afterlogic Software License if commercial version of the product was purchased.