----------------------------------------------------------------------------------------
X.O.W.S
----------------------------------------------------------------------------------------

XMPP Over WebSocket


Version: 0.9.0 (beta)
----------------------------------------------------------------------------------------


Presentation
----------------------------------------------------------------------------------------
X.O.W.S (or XoWS) stands for "XMPP Over WebSocket" and is a Javascript XMPP web  client 
that use the WebSocket protocole. 

The main idea of the project is initially to create a XMPP client with the following 
caracteristics:
- Free from thirdparty library, lightweight and quick to load.
- Performant with low memory footprint.
- Allowing easy customisation and creation of graphical theme / web interface.
- Implementing features closer to modern chat clients like a one with name 
  beginning by "D".

The library is written in old fashion C-style Javascript to keep code as clear and 
optimized as possible, avoiding as most as possible Javascript false friends like the 
"this" keyword, anonymous functions, and modern Javascript syntax and confusional 
paradigms such as promises, sync and async functions features.

The library is currently made of one big file, but can easily separated into several 
autonomous modules since it was designed in successive abstraction layers with adjacent 
modules: WebSocket API layer, XML tools Module, SASL module, XMPP low-level client, 
XMPP backend client, Web Interface manager, Front-end manager etc...


XMPP Client Features
----------------------------------------------------------------------------------------
- Connexion to server via WebSocket
- In-Band Registration to server.
- SASL Authentication using SAH-1, DIGEST-MD5 or PLAIN mechanism
- Message Carbons (EXP-0280)
- Message Archive Management (XEP-0313)
- User Avatar (XEP-0084)
- User Nickname (XEP-0172)
- vCard4 Over XMPP and vcard-temp (XEP-0292, XEP-0054)
- HTTP File Upload (XEP-0363)
- Partial support for Multi-User Chat (XEP-0045)


Version history
----------------------------------------------------------------------------------------

0.9.0 (2021-02-07)
 - First public BETA release
