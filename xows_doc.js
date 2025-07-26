/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                          ____       ____
 *                          \   \     /   /
 *                           \    \_/    /
 *                      .   .-           -.   .
 *                     /|  /   -.     .-   \  |\
 *                    | \_/  |___\   /___|  \_/ |
 *                    .                         .
 *                     \.__       ___       __./
 *                         /     /   \     \
 *                        /_____/     \_____\
 *
 *                     Copyright (c) 2022 Eric M.
 *
 *     This file is part of X.O.W.S (XMPP Over WebSocket Library).
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source
 *
 * @licend
 */
"use strict";
/* ------------------------------------------------------------------
 *
 *                     DOM Managment API Module
 *
 * ------------------------------------------------------------------ */

/**
 * Get document element by Id (alias of getElementById)
 *
 * @param   {string}    id    Element id to get.
 */
function xows_doc(id)
{
  return document.getElementById(id);
}

/**
 * Add an event listener to the specified object with proper options
 *
 * @param   {element}   element   Element to add event listener to
 * @param   {string}    event     Event type to listen
 * @param   {function}  callback  Callback function for event listener
 * @param   {boolean}   [passive] Optional force enable or disable passive
 */
function xows_doc_listener_add(element, event, callback, passive = true)
{
  element.addEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Remove an event listener from the specified object
 *
 * @param   {element}   element   Element to add event listener to
 * @param   {string}    event     Event type to listen
 * @param   {function}  callback  Callback function for event listener
 * @param   {boolean}   [passive] Optional force enable or disable passive
 */
function xows_doc_listener_rem(element, event, callback, passive = true)
{
  element.removeEventListener(event,callback,{capture:false,passive:passive});
}

/**
 * Chechk whether element has class in its class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_has(id, clsname)
{
  return document.getElementById(id).classList.contains(clsname);
}

/**
 * Toggle the specified class in element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 * @param   {string}    force     Force add or remove
 */
function xows_doc_cls_tog(id, clsname, force)
{
  return document.getElementById(id).classList.toggle(clsname, force);
}

/**
 * Add the specified class to element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_add(id, clsname)
{
  document.getElementById(id).classList.add(clsname);
}

/**
 * Remove the specified class to element class list
 *
 * @param   {string}    id        Document element id
 * @param   {string}    clsname   Class name
 */
function xows_doc_cls_rem(id, clsname)
{
  document.getElementById(id).classList.remove(clsname);
}

/**
 * Show the specified item, either element object or id
 *
 * @param   {string}    id        Document element id
 * @param   {boolean}   force     Force show or hide
 */
function xows_doc_show(id, force = true)
{
  document.getElementById(id).hidden = !force;
}

/**
 * Hide the specified item, either element object or id
 *
 * @param   {string}    id        Document element id
 * @param   {boolean}   force     Force hide or show
 */
function xows_doc_hide(id, force = false)
{
  document.getElementById(id).hidden = !force;
}

/**
 * Check whether the specified item, either element object or id is
 * hidden (has the .hidden class)
 *
 * @param   {string}    id        Document element id
 *
 * @return  {boolean}   True if element is visible, false otherwise
 */
function xows_doc_hidden(id)
{
  return document.getElementById(id).hidden;
}

/**
 * Object that stores offscreen Documents Fragments
 */
const xows_doc_frag_db = new Map();

/**
 * Clone specified element from source offscreen slot to
 * destination offscreen slot
 *
 * @param   {string}    dst       Destination offscreen slot identifier
 * @param   {string}    src       Source offscreen slot identifier
 * @param   {string}    element   Offscreen base element id
 */
function xows_doc_frag_clone(dst, src, element)
{
  // create slot if required
  if(!xows_doc_frag_db.has(dst))
    xows_doc_frag_db.set(dst,new Map());

  let s, d;

  // set source and destination
  s = xows_doc_frag_db.get(src).get(element);
  d = document.createDocumentFragment();
  xows_doc_frag_db.get(dst).set(element, d);

  // clone source nodes to destination
  for(let i = 0, n = s.childNodes.length; i < n; ++i)
    d.appendChild(s.childNodes[i].cloneNode(true));
}

/**
 * Backup specified element content to an offscreen document fragment
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    element   Offscreen base element id
 * @param   {boolean}   clone     Indicate that nodes must be cloned
 */
function xows_doc_frag_export(slot, element, clone)
{
  // create slot if required
  if(!xows_doc_frag_db.has(slot))
    xows_doc_frag_db.set(slot,new Map());

  let s, d;

  // set source and destination
  s = document.getElementById(element);
  d = document.createDocumentFragment();
  xows_doc_frag_db.get(slot).set(element, d);

  if(clone) {

    // clone children from document to fragment
    for(let i = 0, n = s.childNodes.length; i < n; ++i)
      d.appendChild(s.childNodes[i].cloneNode(true));

  } else {

    // move children from fragment to document
    while(s.childNodes.length)
      d.appendChild(s.firstChild);

  }
}

/**
 * Restore specified element from offscreen fragment
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    element   Offscreen base element id
 * @param   {boolean}   clone     Clone nodes
 */
function xows_doc_frag_import(slot, element, clone)
{
  if(xows_doc_frag_db.has(slot)) {

    let s, d;

    // set source and destination
    s = xows_doc_frag_db.get(slot).get(element);
    d = document.getElementById(element);

    // empty destination
    d.innerText = "";

    if(clone) {

      // clone children from fragment to document
      for(let i = 0, n = s.childNodes.length; i < n; ++i) {
        d.appendChild(s.childNodes[i].cloneNode(true));
      }

    } else {

      // move children from fragment to document
      while(s.childNodes.length) {
        d.appendChild(s.firstChild);
      }
    }
  }
}

/**
 * Delete specified offscreen document fragment
 *
 * @param   {string}    slot      Offscreen slot identifier
 */
function xows_doc_frag_delete(slot)
{
  xows_doc_frag_db.delete(slot);
}

/**
 * Delete all offscreen document fragment
 */
function xows_doc_frag_clear()
{
  xows_doc_frag_db.clear();
}

/**
 * Get offscreen slot saved root element
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    id        Offscreen base element id
 */
function xows_doc_frag_element(slot, id)
{
  if(xows_doc_frag_db.has(slot))
    return xows_doc_frag_db.get(slot).get(id);

  return null;
}

/**
 * Get element within backed document fragment element
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    id        Child element id to search
 */
function xows_doc_frag_find(slot, id)
{
  if(xows_doc_frag_db.has(slot)) {

    const frag = xows_doc_frag_db.get(slot);

    if(frag.has(id))
      return frag.get(id);

    let node;
    for(const element of frag.values())
      if(node = element.getElementById(id))
        return node;
  }

  return null;
}

/**
 * Find child element with specified id in offscreen root element
 *
 * @param   {string}    slot      Offscreen slot identifier
 * @param   {string}    element   Offscreen base element id
 * @param   {string}    id        Child element id to search
 */
function xows_doc_frag_element_find(slot, element, id)
{
  if(xows_doc_frag_db.has(slot)) {

    const frag = xows_doc_frag_db.get(slot);

    if(frag.has(element))
      return frag.get(element).getElementById(id);
  }

  return null;
}

/**
 * Object that stores offscreen Scroll Parameters
 */
const xows_doc_scrl_db = new Map();

/**
 * Flag to signal scroll was programatically edited
 */
let xows_doc_scrl_edit = false;

/**
 * Create new offscreen scroll parameters.
 *
 * @param   {string}    slot      Offscreen slot identifier
 */
function xows_doc_scrl_init(slot)
{
  xows_doc_scrl_db.set(slot,{
    scrollTop    : 0,
    scrollHeight : 0,
    clientHeight : 0,
    scrollBottom : 0 }); //< ad-hoc porperty
}

/**
 * Get offscreen scroll parameters.
 *
 * @param   {string}    slot      Offscreen slot identifier
 *
 * @return  {object}    Offscreen scroll parameters
 */
function xows_doc_scrl_get(slot)
{
  return xows_doc_scrl_db.get(slot);
}

/**
 * Save specified element scroll parameters to offscreen slot.
 *
 * @param   {string}    slot      Destination offscreen slot
 * @param   {string}    id        DOM element Id to be saved
 */
function xows_doc_scrl_export(slot, id)
{
  const s = document.getElementById(id);

  // Compute scrollBottom from current state before saving
  s.scrollBottom = s.scrollHeight - (s.clientHeight + s.scrollTop);

  xows_doc_scrl_db.set(slot,{
    scrollTop    : s.scrollTop,
    scrollHeight : s.scrollHeight,
    clientHeight : s.clientHeight,
    scrollBottom : s.scrollBottom || 0 }); //< ad-hoc porperty
}

/**
 * Copy offscreen scroll parameters from one slot to another
 *
 * @param   {string}    dst       Destination offscreen slot
 * @param   {string}    src       Source offscreen slot
 */
function xows_doc_scrl_copy(dst, src)
{
  xows_doc_scrl_db.set(dst, xows_doc_scrl_db.get(src));
}

/**
 * Delete offscreen scroll parameters.
 *
 * @param   {string}    slot      Offscreen slot identifier
 */
function xows_doc_scrl_delete(slot)
{
  return xows_doc_scrl_db.delete(slot);
}

/**
 * Clears all offscreen scroll parameters (reset database).
 */
function xows_doc_scrl_clear()
{
  return xows_doc_scrl_db.clear();
}

/**
 * Import offscreen scroll parameters to the specified DOM element, adjusting
 * element's scroll position against the bottom of scrollable content,
 * compensating any changes of client area or scrollable content size.
 *
 * @param   {string}    slot      Source offscreen slot
 * @param   {string}    id        DOM element Id to be updated
 */
function xows_doc_scrl_import(slot, id)
{
  const s = xows_doc_scrl_db.get(slot);
  const d = document.getElementById(id);

  // Signal scroll was edited so next "onscroll" event must be ignored
  xows_doc_scrl_edit = true;

  // Use ad-hoc "scrollBottom" property to adjust scroll position
  // relative to the bottom of the scrollable content.
  d.scrollBottom = s.scrollBottom;
  d.scrollTop = d.scrollHeight - (d.clientHeight + d.scrollBottom);

  //xows_log(1,"doc_scrl_import","scrollBottom="+d.scrollBottom,"scrollTop="+d.scrollTop+" scrollHeigh="+d.scrollHeight+" clientHeight="+d.clientHeight);
}

/**
 * Calculates and store the element's scroll position relative to the bottom
 * of the scrollable content allowing later scroll adjustment relative to the
 * bottom of the scrollable content.
 *
 * @param   {element|object}  element  DOM element or object to save
 */
function xows_doc_scrl_save(element)
{
  // DOM stock scroll parameters are designed in the perspective of TOP-to-DOWN
  // scroll, keeping the scroll position relative to the TOP of the scrollable
  // content in case of client area or scrollable content size changes.
  //
  // This is a problem in some contexts (for instance, in chat history), where
  // scroll mechanism is usually reversed (DOWN-to-TOP) and where in case of
  // client area or scrollable content size change, the scroll position should
  // be kept reltative to the scrollable content's BOTTOM.
  //
  // As workaround, we create and maintain an ad-hoc "scrollBottom" property
  // in the scrollable element's parent, which is the calculated scroll position
  // relative to the BOTTOM of scrollable content. We then can use this
  // parameter to do the required math to counter the Browser defaut behavior.

  // Save parameters
  element.scrollBottom = element.scrollHeight - (element.clientHeight + element.scrollTop);
}

/**
 * Adjusts the element's scroll to compensate client area or scrollable content
 * size change, in the way to keep it at same position relative to scrollable
 * content's bottom.
 *
 * @param   {element|object}  element  DOM element or object to adjust
 */
function xows_doc_scrl_keep(element)
{
  // Signal scroll was edited so next "onscroll" event must be ignored
  xows_doc_scrl_edit = true;

  element.scrollTop = element.scrollHeight - (element.clientHeight + (element.scrollBottom || 0));
}

/**
 * Moves the element's scroll to the bottom of the scrollable content.
 *
 * @param   {element|object}  element  DOM element or object to adjust
 * @param   {boolean}         smooth   Perform smooth scroll (DOM element only)
 */
function xows_doc_scrl_down(element, smooth)
{
  // Signal scroll was edited so next "onscroll" event must be ignored
  xows_doc_scrl_edit = true;

  if(smooth) {
    element.scrollTo({top:(element.scrollHeight - element.clientHeight),behavior:"smooth"});
  } else {
    element.scrollTop = (element.scrollHeight - element.clientHeight);
  }
  element.scrollBottom = 0;
}

/**
 * Returns whether scroll was previously programmatically edited, telling
 * that any "onscroll" event should be ignored.
 *
 * @return  {boolean}   True if scroll was edited, false otherwise
 */
function xows_doc_scrl_edited()
{
  // Modifying scroll parameter programmatically triggers an "onscroll" event
  // the same as if user actually scrolled from Browser window. This produce
  // unwanted scroll position "save" whitch mess up all calculations.
  //
  // To prevent that, after each scroll adjustment on resize, we set a flag
  // to signal that the "onscroll" event was fired by automatic adjustement
  // so it is possible to ignore the event.
  if(xows_doc_scrl_edit) {
    xows_doc_scrl_edit = false;
    return true;
  } else {
    return false;
  }
}

/**
 * Global reference to document's Selection object
 */
const xows_doc_sel = document.getSelection();

/**
 * Global reference to temporary selection Range object
 */
const xows_doc_rng = document.createRange();

/**
 * Set edition caret either before or after the specified node
 *
 * @param   {element}   node      Reference node to position caret
 * @param   {element}   before    Place caret before of node
 */
function xows_doc_caret_around(node, before = false)
{
  xows_doc_sel.removeAllRanges();
  xows_doc_rng.setStartBefore(node);
  xows_doc_rng.setEndAfter(node);
  xows_doc_rng.collapse(before);
  xows_doc_sel.addRange(xows_doc_rng);
}

/**
 * Set edition caret in the specified node
 *
 * @param   {element}   node      Node to position caret in
 * @param   {boolean}   start     Place caret at beginning of content
 */
function xows_doc_caret_at(node, start = false)
{
  xows_doc_sel.removeAllRanges();
  xows_doc_rng.selectNodeContents(node);
  xows_doc_rng.collapse(start);
  xows_doc_sel.addRange(xows_doc_rng);
}

/**
 * Get current document selection range
 *
 * @param   {number}    index     The zero-based index of the range to return
 */
function xows_doc_sel_rng(index)
{
  return xows_doc_sel.getRangeAt(index);
}

/**
 * Initializes document manager and browser interactions
 *
 * This function cache the static document elements for fast access and
 * setup the nécessary listeners and the callbacks for user and client
 * interactions.
 *
 * @param   {object}    onready   Function to be called once document successfully initialized.
 */
function xows_doc_init(onready)
{
  // Check whether Registering option is enabled
  if(xows_options.gui_allow_register)
    xows_doc_show("auth_regi"); //< The link in Login Page

  // Page screen "scr_page" event listener
  xows_doc_listener_add(xows_doc("scr_page"),   "keyup",  xows_doc_page_onkeyu);
  // Close page button "page_exit" event listener
  xows_doc_listener_add(xows_doc("page_exit"),  "click",  xows_doc_page_onclose);

  // Modal screen "scr_void" event listener
  xows_doc_listener_add(xows_doc("scr_void"),   "click",  xows_doc_void_onclick);
  // Image viewer "over_view" event listener
  xows_doc_listener_add(xows_doc("over_view"),  "click",  xows_doc_view_onclick);

  // Set template callback
  xows_tpl_set_callback("embload",  xows_doc_media_onload);
  xows_tpl_set_callback("emberror", xows_doc_media_onerror);

  // Set application "About" content
  xows_doc("app_about").innerText = XOWS_APP_NAME.toUpperCase()+" v"+XOWS_APP_VERS;

  xows_log(2,"doc_init","document ready");

  // Finaly call onready callback
  if(xows_isfunc(onready)) onready();
}

/**
 * Common on-load callback function for loaded embeded medias
 *
 * @param   {object}    media     Media object that loaded
 */
function xows_doc_media_onload(media)
{
  // Remove the loading style
  media.parentNode.classList.remove("LOADPND");
  media.parentNode.classList.remove("LOADING");

  // Force adjust scroll
  xows_gui_chat_onresize();
}

/**
 * Common on-error callback function for embeded medias loadin error
 *
 * @param   {object}    media     Media object that loaded
 */
function xows_doc_media_onerror(media)
{
  // Remove the loading style
  media.parentNode.classList.remove("LOADPND");
  media.parentNode.classList.remove("LOADING");
  // Add loading error style
  media.parentNode.classList.add("LOADERR");

  // Body may be hidden due to alone link, we force to show it
  media.closest("MESG-MAIN").querySelector("MESG-BODY").hidden = false;
}

/**
 * Apply background blink animation to the specified object
 *
 * @param   {string}    id        Object ID to apply blink to
 * @param   {number}    duration  Blink duration in miliseconds
 */
function xows_doc_blink_bg(id, duration)
{
  if(duration === 0) {
    // remove blink animation class and clean stuff
    xows_doc_cls_rem(id, "BLINK-BG");
  } else {
    // add blink animation class and start timeout
    xows_doc_cls_add(id, "BLINK-BG");
    setTimeout(xows_doc_blink_bg,duration,id,0);
  }
}

/**
 * Apply foreground blink animation to the specified object
 *
 * @param   {string}    id        Object ID to apply blink to
 * @param   {number}    duration  Blink duration in miliseconds
 */
function xows_doc_blink_fg(id, duration)
{
  if(duration === 0) {
    // remove blink animation class and clean stuff
    xows_doc_cls_rem(id, "BLINK-FG");
  } else {
    // add blink animation class and start timeout
    xows_doc_cls_add(id, "BLINK-FG");
    setTimeout(xows_doc_blink_fg,duration,id,0);
  }
}

/* -------------------------------------------------------------------
 *
 * Message Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/

/**
 * Message Dialog-Box style codes definition
 */
const XOWS_STYL_ERR = -1; //< same as XOWS_SIG_ERR
const XOWS_STYL_WRN = 0;  //< same as XOWS_SIG_WRN
const XOWS_STYL_SCS = 1;
const XOWS_STYL_ASK = 2;

/**
 * Message Dialog-Box parameters
 */
const xows_doc_popu_param = {onabort:null,onvalid:null};

/**
 * Message Dialog-Box close.
 */
function xows_doc_popu_close()
{
  // Remove event listeners
  xows_doc_listener_rem(xows_doc("popu_close"), "click", xows_doc_popu_close);
  xows_doc_listener_rem(xows_doc("popu_abort"), "click", xows_doc_popu_onabort);
  xows_doc_listener_rem(xows_doc("popu_valid"), "click", xows_doc_popu_onvalid);

  // reset references
  xows_doc_popu_param.onabort = null;
  xows_doc_popu_param.onvalid = null;

  // hide message box stuff
  xows_doc_hide("over_popu");

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");
}

/**
 * Message Dialog-Box Abort (click on Abort button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_popu_onabort(event)
{
  if(xows_doc_popu_param.onabort)
    xows_doc_popu_param.onabort();

  xows_doc_popu_close(); //< Close message box dialog
}

/**
 * Message Dialog-Box Valid (click on valid button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_popu_onvalid(event)
{
  if(xows_doc_popu_param.onvalid)
    xows_doc_popu_param.onvalid();

  xows_doc_popu_close(); //< Close message box dialog
}

/**
 * Message Dialog-Box open
 *
 * @param   {number}    style     Message box style or null for default
 * @param   {string}    text      Message to display
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_popu_open(style, text, onvalid, valid, onabort, abort, modal)
{
  // Checks for already opened Message Box
  if(xows_doc_popu_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_popu_close();
  }

  let cls;

  switch(style)
  {
  case XOWS_STYL_ERR: cls = "STYL-ERR"; break;
  case XOWS_STYL_WRN: cls = "STYL-WRN"; break;
  case XOWS_STYL_SCS: cls = "STYL-SCS"; break;
  case XOWS_STYL_ASK: cls = "STYL-ASK"; break;
  }

  xows_doc("over_popu").classList = cls;
  xows_doc("popu_text").innerHTML = xows_l10n_get(text);

  xows_doc_show("popu_close", (!onvalid && !onabort));
  xows_doc_show("popu_valid", Boolean(onvalid));
  xows_doc_show("popu_abort", Boolean(onabort));
  if(onvalid) xows_doc("popu_valid").innerText = xows_l10n_get(valid);
  if(onabort) xows_doc("popu_abort").innerText = xows_l10n_get(abort);

  // set callbacks
  xows_doc_popu_param.onabort = onabort;
  xows_doc_popu_param.onvalid = onvalid;

  // if 'modal' show the 'void screen' to catch mouse clicks
  if(modal) {
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  // Add event listeners
  xows_doc_listener_add(xows_doc("popu_close"), "click", xows_doc_popu_close);
  xows_doc_listener_add(xows_doc("popu_abort"), "click", xows_doc_popu_onabort);
  xows_doc_listener_add(xows_doc("popu_valid"), "click", xows_doc_popu_onvalid);

  // Show popup dialog
  xows_doc_show("over_popu");
}

/**
 * Message Dialog-Box open with predefined values for Save changes
 *
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {function} [onabort]  Optional callback function for abort/reset
 */
function xows_doc_popu_open_for_save(onvalid, onabort)
{
  if(xows_doc_hidden("over_popu"))
    xows_doc_popu_open(null, "It remains unsaved changes",
                          onvalid, "Save changes",
                          onabort, "Reset");
}

/**
 * Message Dialog-Box modal check and blink
 *
 * This function is used in context where message box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the message box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * message box blink, and the function returns true to tell the caller
 * that message box 'is' modal, and must deny user to continue.
 */
function xows_doc_popu_modal()
{
  if(!xows_doc_hidden("over_popu") && xows_doc_popu_param.onabort) {
    xows_doc_blink_bg("over_popu", 600); //< blinking Message box
    return true;
  }
  return false;
}

/* -------------------------------------------------------------------
 *
 * Input Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Input Dialog-Box parameters
 */
const xows_doc_ibox_param = {onabort:null,onvalid:null,oninput:null,modal:false};

/**
 * Input Dialog-Box function or allow or deny validation
 *
 * @param   {boolean}   allow     Allow or deny validation
 */
function xows_doc_ibox_allow(allow)
{
  xows_doc("ibox_valid").disabled = !allow;
}

/**
 * Input Dialog-Box function to set error message
 *
 * @param   {string}    text     Error text to set or null to disable
 */
function xows_doc_ibox_error(text)
{
  xows_doc("ibox_error").innerText = xows_l10n_get(text);
  xows_doc_blink_fg("ibox_error",600);
}

/**
 * Input Dialog-Box close.
 */
function xows_doc_ibox_close()
{
  if(xows_doc_hidden("over_ibox"))
    return;

  // Remove event listeners
  xows_doc_listener_rem(xows_doc("ibox_close"), "click", xows_doc_ibox_close);
  xows_doc_listener_rem(xows_doc("ibox_abort"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_rem(xows_doc("ibox_valid"), "click", xows_doc_ibox_onvalid);
  xows_doc_listener_rem(xows_doc("ibox_input"), "input", xows_doc_ibox_oninput);

  // reset references
  xows_doc_ibox_param.onabort = null;
  xows_doc_ibox_param.onvalid = null;
  xows_doc_ibox_param.oninput = null;

  if(xows_doc_ibox_param.modal) {
    // Remove keyboard input event listener
    xows_doc_listener_rem(document, "keyup", xows_doc_ibox_onkey);
  }

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // hide message box stuff
  xows_doc_hide("over_ibox");

  // Disable modal routine
  xows_doc_ibox_param.modal = false;
}

/**
 * Input Dialog-Box Input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_oninput(event)
{
  const value = xows_doc("ibox_input").value;

  if(xows_doc_ibox_param.oninput) {
    xows_doc_ibox_param.oninput(value);
  } else {
    // default behavior
    xows_doc("ibox_valid").disabled = !value.length;
  }
}

/**
 * Input Dialog-Box Abort (click on Abort button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onabort(event)
{
  if(xows_doc_ibox_param.onabort)
    xows_doc_ibox_param.onabort();

  xows_doc_ibox_close();
}

/**
 * Input Dialog-Box Valid (click on valid button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onvalid(event)
{
  if(xows_doc_ibox_param.onvalid)
    xows_doc_ibox_param.onvalid(xows_doc("ibox_input").value);

  xows_doc_ibox_close();
}

/**
 * Input Dialog-Box keyboard input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_ibox_onkey(event)
{
  // Check for pressed Enter
  if(event.keyCode === 13)
    xows_doc_ibox_onvalid();

  // Check for pressed Esc
  if(event.keyCode === 27)
    xows_doc_ibox_onabort();
}

/**
 * Input Dialog-Box open
 *
 * @param   {string}    head      Dialog head title
 * @param   {string}    hint      Input hint text
 * @param   {string}    phold     Input placeholder text
 * @param   {string}    value     Input default value text
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {function} [oninput]  Optional callback function for input events
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_ibox_open(head, hint, phold, value, onvalid, valid, onabort, abort, oninput, modal = true)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Checks for already opened Input Box
  if(xows_doc_ibox_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_ibox_close();
  }

  xows_doc("ibox_head").innerHTML = xows_l10n_get(head);
  xows_doc("ibox_hint").innerHTML = xows_l10n_get(hint);

  const ibox_input = xows_doc("ibox_input");
  ibox_input.placeholder = xows_l10n_get(phold);
  ibox_input.value = value ? value : "";

  // set callbacks
  xows_doc_ibox_param.onabort = onabort;
  xows_doc_ibox_param.onvalid = onvalid;
  xows_doc_ibox_param.oninput = oninput;

  // Set valid and abort button text
  if(!valid) valid = "Apply";
  if(!abort) abort = "Cancel";
  xows_doc("ibox_valid").innerText = xows_l10n_get(valid);
  xows_doc("ibox_abort").innerText = xows_l10n_get(abort);

  // Reset error text
  xows_doc("ibox_error").innerText = "";

  // enable or disable modal mode
  xows_doc_ibox_param.modal = modal;

  // if 'modal' show the 'void screen' to catch mouse clicks
  if(modal) {
    // Add event listener for keyboard input
    xows_doc_listener_add(document, "keyup", xows_doc_ibox_onkey);
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  //xows_doc_show("ibox_close", !modal);

  // Call to oninput to initialize button status
  xows_doc_ibox_oninput();

  // Add event listeners
  xows_doc_listener_add(xows_doc("ibox_close"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_add(xows_doc("ibox_abort"), "click", xows_doc_ibox_onabort);
  xows_doc_listener_add(xows_doc("ibox_valid"), "click", xows_doc_ibox_onvalid);
  xows_doc_listener_add(xows_doc("ibox_input"), "input", xows_doc_ibox_oninput);

  xows_doc_show("over_ibox");

  // Set input focus
  ibox_input.focus();
}

/**
 * Input Dialog-Box modal check and blink
 *
 * This function is used in context where input box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the input box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * input box blink, and the function returns true to tell the caller
 * that input box 'is' modal, and must deny user to continue.
 *
 * @return {boolean}    True if dialog 'is' modal, false otherwise
 */
function xows_doc_ibox_modal()
{
  if(!xows_doc_hidden("over_ibox")) {
    if(xows_doc_ibox_param.modal) {
      xows_doc_blink_bg("over_ibox", 600); //< blinking Message box
      return true;
    } else {
      xows_doc_ibox_close();
    }
  }

  return false;
}

/* -------------------------------------------------------------------
 *
 * Message Dialog-Box routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Message Dialog-Box parameters
 */
const xows_doc_mbox_param = {onvalid:null,onabort:null,modal:false};

/**
 * Message Dialog-Box close.
 */
function xows_doc_mbox_close()
{
  if(xows_doc_hidden("over_mbox"))
    return;

  // Remove event listeners
  xows_doc_listener_rem(xows_doc("mbox_close"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_rem(xows_doc("mbox_abort"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_rem(xows_doc("mbox_valid"), "click", xows_doc_mbox_onvalid);

  // reset callback functions
  xows_doc_mbox_param.onvalid = null;
  xows_doc_mbox_param.onabort = null;

  // Hide message box
  xows_doc_hide("over_mbox");

  // Remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // Disable modal routine
  xows_doc_mbox_param.modal = false;
}

/**
 * Message Dialog-Box on-Valid callback
 */
function xows_doc_mbox_onvalid()
{
  if(xows_doc_mbox_param.onvalid)
    xows_doc_mbox_param.onvalid();

  xows_doc_mbox_close();
}

/**
 * Message Dialog-Box on-Abort callback
 */
function xows_doc_mbox_onabort()
{
  if(xows_doc_mbox_param.onabort)
    xows_doc_mbox_param.onabort();

  xows_doc_mbox_close();
}

/**
 * Message Dialog-Box open
 *
 * @param   {number}    style     Message box style or null for default
 * @param   {string}    head      Dialog head title
 * @param   {string}    mesg      Dialog message text
 * @param   {function} [onvalid]  Optional callback function for valid/save
 * @param   {string}   [valid]    Optional valid button text or null to hide
 * @param   {function} [onabort]  Optional callback function for abort/reset
 * @param   {string}   [abort]    Optional abort button text or null to hide
 * @param   {boolean}  [modal]    Optional open in 'modal' dialog mode
 */
function xows_doc_mbox_open(style, head, mesg, onvalid, valid, onabort, abort, modal = true)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Checks for already opened Input Box
  if(xows_doc_mbox_modal()) {
    return; //< do not close modal ones
  } else {
    xows_doc_mbox_close();
  }

  let cls;
  switch(style)
  {
  case XOWS_STYL_ERR: cls = "STYL-ERR"; break;
  case XOWS_STYL_WRN: cls = "STYL-WRN"; break;
  case XOWS_STYL_SCS: cls = "STYL-SCS"; break;
  case XOWS_STYL_ASK: cls = "STYL-ASK"; break;
  }
  xows_doc("mbox_icon").classList = cls;

  xows_doc("mbox_head").innerHTML = xows_l10n_get(head);
  xows_doc("mbox_text").innerHTML = xows_l10n_get(mesg);

  // set callbacks
  xows_doc_mbox_param.onabort = onabort;
  xows_doc_mbox_param.onvalid = onvalid;

  // Set valid and abort button text
  if(!valid) valid = "OK";
  xows_doc("mbox_valid").innerText = xows_l10n_get(valid);
  if(onabort) {
    if(!abort) abort = "Cancel";
    xows_doc_show("mbox_abort");
    xows_doc("mbox_abort").innerText = xows_l10n_get(abort);
  } else {
    xows_doc_hide("mbox_abort");
  }

  // enable or disable modal mode
  xows_doc_mbox_param.modal = modal;

  if(modal) {
    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }

  //xows_doc_show("mbox_close", !modal);

  // Add event listeners
  xows_doc_listener_add(xows_doc("mbox_close"), "click", xows_doc_mbox_close);
  xows_doc_listener_add(xows_doc("mbox_abort"), "click", xows_doc_mbox_onabort);
  xows_doc_listener_add(xows_doc("mbox_valid"), "click", xows_doc_mbox_onvalid);

  // show the Popup Dialog main frame
  xows_doc_show("over_mbox");
}

/**
 * Input Dialog-Box modal check and blink
 *
 * This function is used in context where input box act as modal
 * or semi-modal dialog (eg. page cannot be closed without valid
 * or abort).
 *
 * If the input box is openned and have a valid onabort callback, it
 * is assumed that the dialog is at least semi-modal, then, the
 * input box blink, and the function returns true to tell the caller
 * that input box 'is' modal, and must deny user to continue.
 *
 * @return {boolean}    True if dialog 'is' modal, false otherwise
 */
function xows_doc_mbox_modal()
{
  if(!xows_doc_hidden("over_mbox")) {
    if(xows_doc_mbox_param.modal) {
      xows_doc_blink_bg("over_mbox", 600); //< blinking Message box
      return true;
    } else {
      xows_doc_mbox_close();
    }
  }

  return false;
}
/* -------------------------------------------------------------------
 *
 * Dialog/Config Pages routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Dialog Page parameters
 */
const xows_doc_page_param = {pageid:null,onclose:null,oninput:null,onclick:null};

/**
 * Dialog Page on-input callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_oninput(event)
{
  xows_doc_page_param.oninput(event.target);
}

/**
 * Dialog Page on-click callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_onclick(event)
{
  xows_doc_page_param.onclick(event.target);
}

/**
 * Dialog Page Close (click on close button) callback
 *
 * @param   {object}    event     Event data
 */
function xows_doc_page_onclose(event)
{
  if(!xows_doc_popu_modal())
    xows_doc_page_close(); //< close dialog page
}

/**
 * Dialog Page Close
 *
 * @param   {boolean}   soft      Soft close, prepare for new page to open only.
 */
function xows_doc_page_close()
{
  if(!xows_doc_page_param.pageid)
    return;

  xows_log(2,"doc_page_close",xows_doc_page_param.pageid);

  const page = xows_doc(xows_doc_page_param.pageid);

  // Revert window title to previous one
  if(page.title) xows_gui_wnd_title_pop();

  // remove "input" event listener
  if(xows_doc_page_param.oninput) {
    xows_doc_listener_rem(page,"input",xows_doc_page_oninput);
    xows_doc_page_param.oninput = null;
  }

  // remove "click" event listener
  if(xows_doc_page_param.onclick) {
    xows_doc_listener_rem(page,"click",xows_doc_page_onclick);
    xows_doc_page_param.onclick = null;
  }

  // call exit callback
  if(xows_doc_page_param.onclose)
    xows_doc_page_param.onclose();

  // reset callback functions
  xows_doc_page_param.onclose = null;

  // hide close button Overlay
  xows_doc_hide("colr_exit");

  // hide the diloag
  xows_doc_hide(xows_doc_page_param.pageid);
  xows_doc_page_param.pageid = null;

  // also exit potentially opened message box
  xows_doc_popu_close();

  xows_doc_hide("scr_page");
}

/**
 * Dialog Page Open
 *
 * @param   {string}    id        Page ID to open
 * @param   {boolean}  [close]    Optional force display or hide close button
 * @param   {function} [onclose]  Optional callback function for page close
 * @param   {function} [oninput]  Optional callback function for input events
 * @param   {function} [onclick]  Optional callback function for click events
 */
function xows_doc_page_open(id, close, onclose, oninput, onclick)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  xows_doc_page_close(); //< close any opened dialog

  xows_log(2,"doc_page_open", id);

  xows_doc_show("scr_page");

  // show specific dialog
  xows_doc_show(id);
  xows_doc_page_param.pageid = id;

  if(close) xows_doc_show("colr_exit"); //< show close button

  // set callbacks
  xows_doc_page_param.onclose = onclose;

  const page = xows_doc(id);

  // add "input" event listener
  if(oninput) {
    xows_doc_page_param.oninput = oninput;
    xows_doc_listener_add(page,"input",xows_doc_page_oninput);
  }

  // add "click" event listener
  if(onclick) {
    xows_doc_page_param.onclick = onclick;
    xows_doc_listener_add(page,"click",xows_doc_page_onclick);
  }

  // Change window title accorging page title
  if(page.title)
    xows_gui_wnd_title_set(xows_l10n_get(page.title)+" - XOWS");

  // also exit potentially opened message box
  xows_doc_popu_close();
}

/**
 * Dialog Page on-keyup callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_page_onkeyu(event)
{
  if(xows_doc_page_param.pageid && event.keyCode === 13) {
    // Emulate click on Valid button
    if(!xows_doc_hidden("over_popu") && !xows_doc_hidden("popu_valid")) {
     xows_doc("popu_valid").click();
   } else {
     // Emulate click on submit button
     const submit = xows_doc(xows_doc_page_param.pageid).querySelector("*[type='submit']");
     if(submit) submit.click();
   }
  }
}

/**
 * Check whether given page is the currently openned one
 *
 * @param   {string}    page      Page ID to check
 *
 * @return  {boolean}   True if page is openned, false otherwise
 */
function xows_doc_page_opened(page)
{
  return (xows_doc_page_param.pageid == page);
}

/* -------------------------------------------------------------------
 *
 * Drop menus routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Currently opened menu elements
 */
const xows_doc_menu_param = {bttn:null,drop:null,onclick:null,onclose:null};

/**
 * Close current opened menu
 */
function xows_doc_menu_close()
{
  const param = xows_doc_menu_param;

  // Hide drop element
  if(param.drop)
    param.drop.hidden = true;

  // Remove event listener from menu drop element
  if(param.onclick)
    xows_doc_listener_rem(param.drop, "click", param.onclick);

  if(param.onclose)
    param.onclose();

  // Unfocus button element
  if(param.bttn)
    param.bttn.blur();

  // hide the 'void' screen
  xows_doc_hide("scr_void");

  // Reset parameters
  param.drop = null;
  param.bttn = null;
  param.onclick = null;
  param.onclose = null;
}

/**
 * Toggle menu drop
 *
 * This function toggle the specified menu and show the invisible menu
 * screen to gather click event outside menu.
 *
 * @param   {element}   button    Menu button element
 * @param   {string}    dropid    Menu drop-down element Id
 * @param   {function}  onclick   Menu on-click callback
 * @param   {function}  [onshow]  Optional Menu on-show callback
 * @param   {function}  [onclose] Optional Menu on-close callback
 */
function xows_doc_menu_toggle(button, dropid, onclick, onshow, onclose)
{
  const param = xows_doc_menu_param;

  // Check whether menu is already open
  if(param.bttn) {

    // Close openned menu
    xows_doc_menu_close();

  } else {

    // Save parameters
    const drop = xows_doc(dropid);

    if(!button || !drop)
      return;

    // Set parameters
    param.bttn = button;
    param.drop = drop;
    param.onclick = onclick;
    param.onclose = onclose;

    // Add event listener to menu drop element
    if(param.onclick)
      xows_doc_listener_add(param.drop, "click", param.onclick);

    // show the 'void' screen to catch clicks outside menu
    xows_doc_show("scr_void");

    // Show menu drop element (BEFORE onshow for correct placement !)
    param.drop.hidden = false;

    // Call optionnal onshow function
    if(xows_isfunc(onshow))
      onshow(param.bttn, param.drop);

    // Focus on button element
    param.bttn.focus();
  }
}

/* -------------------------------------------------------------------
 *
 * Image view routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Media Viewer screen open
 *
 * @param   {object}    media     DOM element that throwed event
 */
function xows_doc_view_open(media)
{
  // Check for image media to view
  if(media.tagName === "IMG") {

    // set proper link and references
    xows_doc("view_img").src = media.src;
    //xows_doc("view_open").href = media.src;

    // show the media overlay element
    xows_doc_show("over_view");

    // show the 'void' screen with dark filter
    xows_doc_cls_add("scr_void", "VOID-DARK");
    xows_doc_show("scr_void");
  }
}

/**
 * Media Viewer screen close
 */
function xows_doc_view_close()
{
  const over_view = xows_doc("over_view");

  if(over_view.hidden)
    return;

  // hide the media overlay element
  over_view.hidden = true;

  // reset image reference
  xows_doc("view_img").src = "";

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");
}

/**
 * Media Viewer screen on-click event callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_view_onclick(event)
{
  switch(event.target.id)
  {
  case "view_optab":
    // Get the <img> element and open in new tab
    window.open(event.target.parentNode.querySelector("IMG").src, '_blank').focus();
    break;
  default:
    // Close image view
    xows_doc_view_close();
    break;
  }
}

/* -------------------------------------------------------------------
 *
 * Contact/Occupant profile Popup routines
 *
 * -------------------------------------------------------------------*/
/**
 * Contact Profile Popup parameters
 */
const xows_doc_prof_param = {peer:null,onclick:null};

/**
 * Contact Profile Popup on-click callback
 *
 * @param   {object}    event     Event object
 */
function xows_doc_prof_onclick(event)
{
  if(event.target.id == "prof_close") {
    xows_doc_prof_close();
    return;
  }

  if(xows_doc_prof_param.onclick)
    xows_doc_prof_param.onclick(xows_doc_prof_param.peer, event.target);
}

/**
 * Contact Profile Popup close
 */
function xows_doc_prof_close()
{
  const over_prof = xows_doc("over_prof");

  // Prevent hidding void-sreen
  if(over_prof.hidden)
    return;

  // Remove "click" event listener
  xows_doc_listener_rem(over_prof,"click",xows_doc_prof_onclick);

  // Reset parameters
  xows_doc_prof_param.peer = null;
  xows_doc_prof_param.onclick = null;

  // remove 'dark' filter and hide 'void' screen
  xows_doc_cls_rem("scr_void", "VOID-DARK");
  xows_doc_hide("scr_void");

  // hide popop
  over_prof.hidden = true;
}

/**
 * Contact Profile Popup Update
 */
function xows_doc_prof_update()
{
  const peer = xows_doc_prof_param.peer;

  const over_prof = xows_doc("over_prof");

  // Fill common peer informations
  over_prof.querySelector("PEER-NAME").innerText = peer.name;
  over_prof.querySelector("PEER-ADDR").innerText = peer.jbar ? peer.jbar : "";
  over_prof.querySelector("BADG-SHOW").dataset.show = peer.show || 0;
  // Set proper class for avatar
  over_prof.querySelector("PEER-AVAT").className = xows_tpl_spawn_avat_cls(peer);

  // Set State message or keep placeholder
  const peer_meta = over_prof.querySelector("PEER-META");
  peer_meta.innerText = peer.stat ? peer.stat : "";
  peer_meta.className = peer.stat ? "" : "PLACEHOLD";

  let cont;
  const prof_subs = xows_doc("prof_subs");
  const prof_addc = xows_doc("prof_addc");

  // Set Occupant informations
  if(peer.type === XOWS_PEER_OCCU) {

    if(peer.jbar)
      cont = xows_cli_cont_get(peer.jbar);

    let affi_txt;
    switch(peer.affi)
    {
    case XOWS_AFFI_OWNR: affi_txt = "Owner"; break;
    case XOWS_AFFI_ADMN: affi_txt = "Administrator"; break;
    case XOWS_AFFI_MEMB: affi_txt = "Member"; break;
    default: affi_txt = "Unaffiliated"; break;
    }

    const prof_affi = xows_doc("prof_affi");
    prof_affi.innerText = xows_l10n_get(affi_txt);
    prof_affi.dataset.affi = peer.affi;

    let role_txt;
    switch(peer.role)
    {
    case XOWS_ROLE_MODO: role_txt = "Moderator"; break;
    case XOWS_ROLE_PART: role_txt = "Participant"; break;
    default: role_txt = "Visitor"; break;
    }

    const prof_role = xows_doc("prof_role");
    prof_role.innerText = xows_l10n_get(role_txt);
    prof_role.dataset.role = peer.role;

    // Check if we can get Contact object
    if(peer.jbar)
      cont = xows_cli_cont_get(peer.jbar);

    xows_doc_show("prof_occu");

  } else {

    cont = peer;
    xows_doc_hide("prof_occu");
  }

  if(!peer.self) {

    let subs_txt;
    let subs_lvl = 0;

    if(cont) {
      prof_subs.hidden = false; //< Show subscription level
      prof_addc.hidden = true;  //< Hide subscribe button
      switch(cont.subs)
      {
      case XOWS_SUBS_BOTH: subs_txt = "Mutual"; break;
      default:             subs_txt = "Pending"; break;
      }
      subs_lvl = cont.subs;
    } else {
      const subs_stat = xows_cli_peer_subsste(peer);
      prof_subs.hidden = (subs_stat < 1); //< Show/hide subscription level
      prof_addc.hidden = (subs_stat > 0); //< Show/hide subscribe button
      switch(subs_stat)
      {
      case 1:
        subs_txt = "Pending";
        subs_lvl = 1;
        break;
      case 2:
        subs_txt = "Unavailable";
        subs_lvl = -1;
        break;
      }
    }

    prof_subs.innerText = xows_l10n_get(subs_txt);
    prof_subs.dataset.subs = subs_lvl;

    xows_doc_show("prof_cont");

  } else {

    xows_doc_hide("prof_cont");
  }
}

/**
 * Contact Profile Popup open
 *
 * @param   {object}    peer      Peer Object, either Contact or Occupant
 * @param   {function} [onclick]  Optional callback function for click events
 */
function xows_doc_prof_open(peer, onclick)
{
  const over_prof = xows_doc("over_prof");

  // Store Occupant object
  xows_doc_prof_param.peer = peer;
  xows_doc_prof_param.onclick = onclick;

  // show the 'void' screen with dark filter
  const src_void = xows_doc("scr_void");
  src_void.className = "VOID-DARK";
  src_void.hidden = false;

  // add "click" event listener
  xows_doc_listener_add(over_prof,"click",xows_doc_prof_onclick);

  // Update content according Peer state
  xows_doc_prof_update();

  // Show popop
  over_prof.hidden = false;
}

/* -------------------------------------------------------------------
 *
 * Void Screen routines and definitions
 *
 * -------------------------------------------------------------------*/
/**
 * Function to proceed click on void 'screen'
 *
 * This function is called when user click on the 'void screen', meaning
 * outside an opened menu or dialog.
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_doc_void_onclick(event)
{
  // check whether a menu is opened, and close it
  if(xows_doc_menu_param.bttn)
    xows_doc_menu_close();

  // Close potentially opened media viewer screen
  xows_doc_view_close();

  // Close potentially opened Contact profile popup
  xows_doc_prof_close();

  // Make potentially opened modal Dialog-Box blinking
  xows_doc_popu_modal();
  xows_doc_ibox_modal();
  xows_doc_mbox_modal();
}

