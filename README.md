keyservice
==========
 
The purpose of this service is to store encryption keys used for encrypting
data on cloud providers.

The intentional use is that a client has contact with both the keyservice and
some other service (which we call "the Real Service"). The keyservice will
provide encryption keys, used by the client to encrypt data before sent to
"the Real Service". Hence, a data breach on "the Real Service" will only leak
encrypted data.

Preferably, the keyservice should not be hosted at the same cloud provider as
"the Real Service". Currently, the keyservice is made to be hosted at the
Google Cloud (using Google Cloud Functions and Google Cloud Storage).

Background
----------

The European Union's General Data Protection Regulation (GDPR) requires full
control over who has acccess to data, and where. But the nature of "cloud
providers" is that you lack insights on how data is handled behind their
interfaces. You can't really guarantee anything regarding storage locations,
access control, old hardware, and how other stuff works behind the scenes.

So, this service is for handling encryption keys on one cloud provider,
and storing the encrypted data on another, to prevent any direct access to the
real data.

How data is stored
------------------

Data is stored as blobs on Google Cloud Storage. The keys (filenames) are
hashed before sent to Google, so they are not readable. This also means that
you can not list the keys/filenames. The very data (content) is encrypted at
Google Cloud Functions using Camellia encryption. On top of that, we pass an
encryption key to Google Cloud Storage for additional AES encryption before
the data is written to disk.

Considerations and implications of the flow
-------------------------------------------

### Should "the Real Service" ever handle unencrypted data?

This is a consideration that you will have to make when designing "the Real
Service".

You probably should not store any unencrypted data, but you might still want
to handle unencrypted data. For example, you might want to send an e-mail to
new users, so you need an API endpoint that does that on sign up. But you
probably don't want that endpoint (or any logs) to store the unencrypted
e-mail address.

Storing unencrypted data that is also stored in encrypted form, will help
someone who is trying to crack your encryption.

One way of handling it, could be to use a third cloud provider for handling
unencrypted stuff that should never be stored, just to make it much harder to
use traffic logs for breaking the crypto.

Yet another way could be to store encrypted tasks, and use some task runner
that is not accessible over the public Internet, to decrypt and handle the
tasks.

### User login authentication at "the Real Service".

Users must be able to login without the personal data that should be encrypted.
This can be made by using heavy hashing of the user credentials on the client
side, if you do not want unencrypted data to be handled by "the Real Service".

### Creation of encryption keys

The current design is that the encryption keys are generated at the client's
end.

### Protection of the encrypted data

Even if you use industry standard heavy cryptos, you still should use
normal precautions to store the crypted/hashed data. This keyservice should
not be your full protection. Crypto algorithms will be cracked, and
brute forcing is always becoming faster.

Endponts when not yet authorized
--------------------------------

### POST /account

Create a new user. A user can be identified by multiple userIds (which are
hashes of e-mail addresses, phone numbers, usernames, or whatever you choose).

This endpoint will return a session token (i.e. it will log in the new user).

Send:

```
{
	"userIds": [
		"<< hash of username/email/whatever >>",
		"<< hash of username/email/whatever >>"
	],
	"password": "<< hash of password >>"
}
```

Returns a session token:

```
{
	"sessionToken": "<<some random string>>"
}
```

Will return an error if any of the userIds is already in use.

### POST /account/login

Send:

```
{
	"userId": "<< hash of username/email/whatever >>",
	"password": "<< hash of password >>"
}
```

Returns a session token:

```
{
	"sessionTokenId": "<<some random string>>"
	"sessionTokenSecret": "<<some random string>>"
}
```

### POST /account/pwreset/init

This endpoint will send a request from the server to a pre-defined URL, which
is probably the service for email templating, which renders an email to the
client.

Two variables will be passed in the request from the server: `trackId` and
`code`. The `trackId` is the same code as you post from the client side, and
you can use it however is needed by the email template server. The `code` is
the code used for doing the password reset at `/account/pwreset/commit`.

```
{
	"userId": "<< hash of username/email/whatever >>",
	"trackId": "<< some id for the reset attempt >>"
}
```

### POST /account/pwreset/commit

The endpoint is used for actually committing the password reset. It requires
a new password and the `code` that was sent to some pre-defined URL when
`/account/pwreset/init` was called.

```
{
	"password": "<< the user's new password >>",
	"code": "<< the password reset code >>"
}
```


Endponts when authorized
------------------------

### POST /account/password

Send:

```
Authorized: ss1 xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

{
	"previousPassword": "<< hash of old password >>",
	"password": "<< hash of new password >>"
}
```

### PUT /account

Use this endpoint for updating your userIds.

Send:

```
Authorized: ss1 xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

{
	"userIds": [
		"<< hash of username/email/whatever >>",
		"<< hash of username/email/whatever >>"
	]
}
```

### DELETE /account

```
Authorized: ss1 xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### PUT /privdata/:key

Stores the body payload (i.e. the encryption key(s)).

The `Authorization:` HTTP header should be a sessionist header created with
the session token as the key id, and the init token as the secret key.

### GET /privdata/:key

Returns the encryption key(s).

The `Authorization:` HTTP header should be a sessionist header created with
the session token as the key id, and the init token as the secret key.

