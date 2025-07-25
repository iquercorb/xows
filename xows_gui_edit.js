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
 *                         GUI API Interface
 *
 *                    Message Edit Panel Sub-Module
 *
 * ------------------------------------------------------------------ */
 /* -------------------------------------------------------------------
 * Edition Panel - Main interactions
 * -------------------------------------------------------------------*/
/**
 * Chat Panel on-click callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_edit_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Check whether click occure within input area
  if(event.target.closest("CHAT-INPT")) {

    // Get selection range
    const rng = xows_doc_sel_rng(0);
    if(rng.collapsed) {
      const node = rng.endContainer;
      // Checks whether current selection is within <emo-ji> node
      if(node.parentNode.tagName === "EMO-JI") {
        // Move caret before or after the <emo-ji> node
        xows_doc_caret_around(node.parentNode, !rng.endOffset);
      }
    }

    // Store selection
    xows_gui_edit_inpt_rng = rng;

    return;
  }

  switch(event.target.id)
  {
    // Message Reply Close button
    case "rply_clos": {
      xows_gui_edit_rply_close();
      break;
    }

    // Upload button
    case "edit_upld": {
      const edit_file = xows_doc("edit_file");
      // Reset file input
      edit_file.value = "";
      // Open the file selector (emulate click)
      edit_file.click();
      break;
    }

    // Emoji button
    case "edit_emoj": {
      // Open Emoji menu
      xows_doc_menu_toggle(xows_doc("edit_emoj"), "drop_emoj",
                           xows_gui_edit_emoj_menu_onclick);
      break;
    }

    default:
      // Set input focus to message edit area
      xows_gui_edit_inpt_setfocus();
      break;
  }
}

/**
 * File Upload file object on-change callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_edit_onfile(event)
{
  const file = xows_doc("edit_file").files[0];

  // Check whether any peer is selected and file object is valid
  if(xows_gui_peer && file)
    xows_gui_upld_start(xows_gui_peer, file);
}
/* -------------------------------------------------------------------
 * Edition Panel - Reply banner routines
 * -------------------------------------------------------------------*/
/**
 * Cancel or reset message reply
 */
function xows_gui_edit_rply_close()
{
  if(!xows_doc_cls_has("chat_edit","REPLY"))
    return;

  // Remove REPLY class from Chat Pannel
  xows_doc_cls_rem("chat_edit","REPLY");

  const edit_rply = xows_doc("edit_rply");
  // Reset data and hide element
  xows_doc("rply_name").innerText = "";
  edit_rply.dataset.id = "";
  edit_rply.dataset.to = "";

  // Remove FOCUS class from message is any
  xows_gui_hist_mesg_hligh(xows_gui_peer, null);
}

/**
 * Set message reply data and elements
 *
 * @param   {element}   li_msg     Selected <li_mesg> Element to reply to
 */
function xows_gui_edit_rply_set(li_msg)
{
  // Cancel any previous Reply
  xows_gui_edit_rply_close();

  const edit_rply = xows_doc("edit_rply");

  // Get most suitable Stanza reference ID, either Origin-Id, Stanza-Id or Id
  const rpid = xows_tpl_mesg_bestref(xows_gui_peer, li_msg);

  // Get proper destination address
  let rpto;
  if(xows_gui_peer.type === XOWS_PEER_CONT) {
    rpto = xows_jid_bare(li_msg.dataset.from);
  } else {
    rpto = li_msg.dataset.from;
  }

  // Retrieve message author
  let peer;
  if(xows_gui_peer.type === XOWS_PEER_ROOM) {
    peer = xows_cli_occu_get_or_new(xows_gui_peer, rpto, li_msg.dataset.ocid);
  } else {
    peer = xows_gui_peer;
  }

  xows_doc("rply_name").innerText = peer.name;
  edit_rply.dataset.to = rpto;
  edit_rply.dataset.id = rpid;
  edit_rply.hidden = false;

  // Set REPLY class to Chat Pannel
  xows_doc_cls_add("chat_edit","REPLY");

  // set replied message highlighted
  xows_gui_hist_mesg_hligh(xows_gui_peer, rpid);

  // Set input focus to message edit area
  xows_gui_edit_inpt_setfocus();
}
/* -------------------------------------------------------------------
 * Edition Panel - Message input Routines
 * -------------------------------------------------------------------*/
/**
 * Set focus and edit caret to chat message input
 */
function xows_gui_edit_inpt_setfocus()
{
  const edit_inpt = xows_doc("edit_inpt");

  // Set input focus to message edit area
  edit_inpt.focus();

  // move edit caret to end of content
  const rng = xows_doc_sel_rng(0);

  if(rng.endContainer !== edit_inpt)
    xows_doc_caret_around(rng.endContainer);
}

/**
 * Chat Message Edition validation (enter) function, called when user
 * press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {object}    input     Input object to validate
 */
function xows_gui_edit_inpt_onenter(input)
{
  // Send message
  if(xows_gui_peer) {

    if(input.innerText.length) {

      const rply = xows_doc("edit_rply");

      // Send message
      xows_cli_send_message(xows_gui_peer, input.innerText.trimEnd(), null, rply.dataset.id, rply.dataset.to);
      input.innerText = ""; //< Empty any residual <br>

      // Reset Reply data
      xows_gui_edit_rply_close();

      // Add CSS class to show placeholder
      input.className = "PLACEHOLD";

    }

    // Reset chatsate to active
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_ACTI);
  }
}

/**
 * Chat message Edition Paste event handling, caled when user
 * paste content from clipload into input area.
 *
 * @param   {object}    event     Clipboard event opbject
 */
function xows_gui_edit_inpt_onpaste(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Get clipboard raw text
  let text = event.clipboardData.getData("text");
  if(!text.length)
    return;

  // Prevent the default clipboard action
  event.preventDefault();

  // Set composing
  if(xows_gui_peer)
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_COMP);

  // Hide the placeholder text
  xows_doc("edit_inpt").className = "";

  // Replace selection by text
  xows_doc_sel.deleteFromDocument();
  xows_doc_sel.getRangeAt(0).insertNode(document.createTextNode(text));
  xows_doc_sel.collapseToEnd();

  // Store selection range
  xows_gui_edit_inpt_rng = xows_doc_sel_rng(0);
}

/**
 * Chat Editor reference to last selection Range object
 */
let xows_gui_edit_inpt_rng = null;

/**
 * Chat Panel on-input callback function
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_edit_inpt_oninput(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Set composing
  if(xows_gui_peer)
    xows_cli_chatstate_define(xows_gui_peer, XOWS_CHAT_COMP);

  // Store selection range
  xows_gui_edit_inpt_rng = xows_doc_sel_rng(0);

  const edit_inpt = document.getElementById("edit_inpt");

  // Check inner text content to show placeholder
  if(edit_inpt.innerText.length < 2) {

    if(edit_inpt.innerText.trim().length === 0) {

      // Add CSS class to show placeholder
      edit_inpt.className = "PLACEHOLD";
      edit_inpt.innerText = ""; //< Empty any residual <br>

      return; //< Return now
    }
  }

  // Hide the placeholder text
  edit_inpt.className = "";
}

/**
 * Chat Editor insert element at/within current/last selection
 *
 * @param   {string}    text      Text to insert
 * @param   {string}   [tagname]  Optional wrapper node tagname
 */
function xows_gui_edit_inpt_insert(text, tagname)
{
  const edit_inpt = document.getElementById("edit_inpt");

  // set default carret position if none saved
  if(!xows_gui_edit_inpt_rng) {
    xows_doc_caret_at(edit_inpt, true);
    xows_gui_edit_inpt_rng = xows_doc_sel_rng(0);
  }

  // Get the last saved selection range (caret position)
  const rng = xows_gui_edit_inpt_rng;

  // Delete content of selection if any
  if(rng && !rng.collapsed)
    rng.deleteContents();

  // Create node to insert
  let node;

  if(tagname) {
    node = document.createElement(tagname);
    node.appendChild(document.createTextNode(text));
  } else {
    node = document.createTextNode(text);
  }

  // Insert node within selected range
  rng.insertNode(node);

  // Hide the placeholder text
  edit_inpt.className = "";

  // Focus on input
  edit_inpt.focus();

  // Move caret after the created node
  xows_doc_caret_around(node);

  // Store selection
  xows_gui_edit_inpt_rng = xows_doc_sel_rng(0);
}

/* -------------------------------------------------------------------
 * Edition Panel - Emoji menu
 * -------------------------------------------------------------------*/
/**
 * Chat Emoji menu button/drop on-click callback
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_edit_emoj_menu_onclick(event)
{
  xows_cli_activity_wakeup(); //< Wakeup presence

  // Retreive the parent <li> element of the event target
  const li = event.target.closest("LI");

  // Check whether we got click from drop or button
  if(li) xows_gui_edit_inpt_insert(li.childNodes[0].nodeValue, "EMO-JI"); //< Insert selected Emoji

  // Close menu
  xows_doc_menu_close();
}

/* -------------------------------------------------------------------
 * Edition Panel - Peer writing notifications
 * -------------------------------------------------------------------*/
/**
 * Handle the received composing state from other contacts to display
 * it in the chat window
 *
 * @param   {object}    peer      Sender peer object
 * @param   {number}    chat      Chat state value
 */
function xows_gui_edit_onchst(peer, chat)
{
  // get Peer chatstat object
  const edit_stat = xows_gui_doc(peer, "edit_stat");

  // In case of Private Messae (from Occupant) Chatstat may come before
  // first message, in this case offscreen document doesn't exists
  if(!edit_stat) return;

  if(peer.type === XOWS_PEER_ROOM) {

    // Count of writting occupants
    const n = peer.writ.length;

    // If no Occupant is writing, empty chatsate
    if(n < 1) {
      edit_stat.innerText = "";
      edit_stat.hidden = true;
      return;
    }

    // Compose writing mention depending number of writing occupants
    if(n > 1) {

      let str = "";

      // We display tow names maximum with the count of other
      // typing people if needed
      const l = (n > 2) ? 2 : n - 1;
      // Add the first, or tow first name(s).
      for(let i = 0; i < l; ++i) {
        str += "<b>"+peer.writ[i].name+"</b>";
        if(i < (l-1)) str += ", ";
      }

      // Now append the last part
      str += " "+xows_l10n_get("and")+" <b>";

      // We add either the last name or the remaining count
      const r = (n - l);
      if(r > 1) {
        str += r+" "+xows_l10n_get("other(s)")+"</b> ";
      } else {
        str += peer.writ[n-1].name+"</b> ";
      }

      edit_stat.innerHTML = str + xows_l10n_get("are currently writing");

    } else {
      edit_stat.innerHTML = "<b>"+peer.writ[0].name+"</b> "+xows_l10n_get("is currently writing");
    }

  } else { // XOWS_PEER_CONT|XOWS_PEER_OCCU

    // If Contact stopped writing, empty chatstate
    if(peer.chat < XOWS_CHAT_COMP) {
      edit_stat.innerText = "";
      edit_stat.hidden = true;
      return;
    }

    // Wet writing string
    edit_stat.innerHTML = "<b>"+peer.name+"</b> "+xows_l10n_get("is currently writing");
  }

  // Show the writing mention
  edit_stat.hidden = false;
}
