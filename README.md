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

The library is divided into several "API Modules" with one file per "module", each 
"module" is dedicated to a specific aspect of the program and have a dedicated function 
name prefix except the "base API". Here is module list and their quick description:

- Low-Level API layer
  - Base (xows_base.js): Base constants and function such as string/bytes manipulation and algorithms
  - l10n Module (xows_l10n.js): Localization mechanisms and translation functions 
  - XML Module (xows_xml.js): XML parsing, manipulation and building functions
  - SALS Module (xows_sasl.js): SASL mechanism implementation
  - WebSocket Module (xows_sck.js): WebSocket interface functions
  - XMPP Protocol Module (xows_xmp.js): "Low-Level" XMPP protocol client interface
- Mid-Level client interface layer
  - Caching Module (xows_cach.js): Data caching and Browser local storage management functions
  - Client Module (xows_cli.js): "High-level" XMPP client interface
- GUI and Public/High-Level interface layer
  - HTML Templates Module (xows_tpl.js): HTML templates download and parsing mechanism
  - DOM Managment Module (xows_doc.js): Browser DOM document management and GUI base tools
  - GUI Module (xows_gui.js): GUI related functions and mechanisms
  - Initialization Module (xows_init.js): The main "Public" API and library initialization functions


XMPP Client Features
----------------------------------------------------------------------------------------
- Connexion to server via WebSocket
- In-Band Registration to server.
- SASL Authentication using SAH-1, DIGEST-MD5 or PLAIN mechanism
- Message Carbons (EXP-0280)
- Message Archive Management (XEP-0313)
- User Avatar (XEP-0084)
- User Nickname (XEP-0172)
- PEP Native Bookmarks (XEP-0402)
- vCard4 Over XMPP and vcard-temp (XEP-0292, XEP-0054)
- HTTP File Upload (XEP-0363)
- Partial support for Multi-User Chat (XEP-0045)


Screenshots
----------------------------------------------------------------------------------------

The following screenshots are not up-to-date and do not reflect exactly the current 
stage of GUI.

![Login page](snapshots/01.jpg)

![User chat](snapshots/02.jpg)

![Chat room](snapshots/03.jpg)


Version history
----------------------------------------------------------------------------------------

0.9.1 (2022-05-09)
 - Refactoring of GUI Module
 - Refactoring of GUI Theme and templates
 - Adding support for PEP Native Bookmarks (XEP-0402)
 - Improved avatar and user data caching mechanisms
 - New "less angry" logo
 - Numerous bugs fixed

0.9.0 (2021-02-07)
 - First public BETA release
