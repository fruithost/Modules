# Aurora two factor auth module

# License
This module is licensed under Afterlogic Software License. Please read LICENSE for more information.

# Setup origings

To get app-key-hash use one of the following way:
1. ```keytool -exportcert -alias KEY_ALIAS -keystore key.jks | openssl sha256 -binary | openssl base64 | sed 's/=//g' | tr '+' '-' | tr '/' '_' ```

2. ```echo "APP_SIGN_KEY_FINGERPRINT" | xxd -r -p | openssl base64 | sed 's/=//g' | tr '+' '-' | tr '/' '_' ```

The app-key-hashes must be put to config as a FacetIds.

# Configuring of the system to support security keys on Android.

To handle security keys in mobile apps the Android FIDO SDK is used. This requires some extra backend configuration. The Android FIDO SDK will check if the app is allowed to work with the backend. To specify which apps are allowed you need to add fingerprints of the certificates the app is signed with. The fingerprints can be taken from the page Google Play console > Setup > App signing. Please note that in most cases, apps have two sign keys. One is called the Upload key the other one is the Distribution key. The Upload key will be used with the debug builds. But release builds will be signed using the Distribution key. So it will be required to specify fingerprint for each used key. 
The app definitions with fingerprints must be available by the following URL: YOU_DOMAIN/.well-known/assetlinks.json. 
You can use /assets/assetlinks.dist.json as a template. In case your users use the original Aurora mobile apps you don't need to modify the file. Just make it available by the required URL by copy the file to the required place. If the ".well-known" is already set up on your domain and you can't just put the file at the required location there is an option to configure your web server. Please make the .well-known/assetlinks.json URL point to YOU_DOMAIN/?assetlinks entry point. In this case, the system will return content of the 
/assets/assetlinks.json file or /assets/assetlinks.dist.json.
