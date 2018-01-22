keyservice
==========

The purpose of this service is to store encryption keys used for encrypting
data on cloud providers.

The intentional use is that a client has contact with both the keyservice and
some "other service" (which we call "the Real Service"). The keyservice will
provide encryption keys, used by the client to encrypt data before sent to
"the Real Service". Hence, a data breach on "the Real Service" will only leak
encrypted data.

Preferably, the keyservice should not be hosted at the same provider as
"the Real Service".

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

Flow
----

### Step 1.

The client creates a (logged in) session at "the Real Service".

### Step 2.

The client connects to the keyservice and gets a random string called an "init
token" in the response.

The client creates an SHA512 hash of the "init token", which we call the "init
token hash".

### Step 3.

The client tells "the Real Service" that it needs the encryption key(s).

It sends the "init token hash" in the request.

### Step 4.

"The Real Service" connects to the keyservice.

It passes on:
* A namespace for this particular "Real Service". (So, multiple real services
  can use the same keyservice.)
* An ID for the user who connected. It can be an ID, a user name, or anything
  unique used by "the Real Service" to identify the user.
* The "init token hash" created at step 2 (and passed to "the Real Service"
  at step 3).

### Step 5. 

The keyservice responds with a session token (which is just a random
string) to "the Real Service", and "the Real Service" passes that session
token on to the client.

### Step 6.

Using the session identifier and the init token, the client can now PUT and
GET it's encryption key(s).

Considerations and implications of the flow
-------------------------------------------

### Should "the Real Service" ever handle unencrypted data?

This is a consideration that you will have to make when designing "the Real
Service".

You probably should not store any unencrypted data, but you might still want
to handle unencrypted data. For example, you might want to send an e-mail to
new users, so you need an API endpoint that does that on sign up. But you
probably don't want that endpoint (or any logs) to store the e-mail address.

Storing unencrypted data that is also encrypted, will help anyone trying to
crack your encryption.

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

Endponts at the keyservice
--------------------------

### POST /init

Returns an "init token"

```
{
	"initToken": "<<some random string>>"
}
```

### POST /connect

This is the request made by "the Real Service" to connect a client to a
specific user on a specific service.

The `Authorization:` HTTP header should be a sessionist header created from
a shared secret.

Request body payload:

```
{
	"namespace": "my_cool_website",
	"userId": "347",
	"initTokenHash": "<<base64 sha512 hash of the init token>>"
}
```

Will respond with:

```
{
	"sessionToken": "<<some random string>>"
}
```

### PUT /key

Stores the body payload (i.e. the encryption key(s)).

The `Authorization:` HTTP header should be a sessionist header created with
the session token as the key id, and the init token as the secret key.

### GET /key

Returns the encryption key(s).

The `Authorization:` HTTP header should be a sessionist header created with
the session token as the key id, and the init token as the secret key.

