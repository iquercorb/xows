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
  xows_cli_pres_show_back(); //< Wakeup presence

  if(event.target.id === "edit_inpt")
    return;

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
                           xows_gui_emoj_menu_onclick,
                           xows_gui_emoj_menu_onshow);
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
 * Edition Panel - Alert banner routines
 * -------------------------------------------------------------------*/
/**
 * Handles click on chat navigation banner.
 *
 * @param   {object}    event      Event object
 */
function xows_gui_edit_alrt_onclick(event)
{
  // Scroll history down, this will also update navigation bar
  // status (and hide it) since scrolling down imply an update
  xows_gui_hist_scrl_down(xows_gui_peer, true);
}

/**
 * Update chat navigation state and visibility according given
 * scroll position relative to client.
 *
 * @param   {object}    peer        Peer object
 * @param   {number}    scroll      Chat Scroll relative to client bottom
 * @param   {number}    client      Chat client height
 */
function xows_gui_edit_alrt_update(peer, scroll, client)
{
  // Get element
  const edit_alrt = xows_gui_doc(peer,"edit_alrt");

  if(scroll >= 50) {

    // If scroll is greater than client height we set the "Old-Message" status
    // which is not formely an alert.
    if(scroll > client)
      edit_alrt.classList.add("OLDMSG");

    // Scroll is pretty far from chat history bottom, if any alter is
    // present we show the navigation bar

    if(edit_alrt.hidden && edit_alrt.classList.length) {
      // Add event listener
      if(peer === xows_gui_peer)
        xows_doc_listener_add(edit_alrt, "click", xows_gui_edit_alrt_onclick);
      edit_alrt.hidden = false;
    }

  } else {

    // Scroll is near bottom of chat history, we reset common alerts
    // and hide navigation bar

    if(!edit_alrt.hidden) {
      // Remove event listener
      if(peer === xows_gui_peer)
        xows_doc_listener_rem(edit_alrt, "click", xows_gui_edit_alrt_onclick);
      edit_alrt.hidden = true;
    }

    // Unset "Old-Message" status, since user is new reading last messages
    edit_alrt.classList.remove("OLDMSG");

    // Reset UNREAD alert, we assume user actualy read the new message
    edit_alrt.classList.remove("UNREAD");
  }
}

/**
 * Adds alert status to navigation bar.
 *
 * Depending current scroll position, the navigation bar may be not shown
 * and UNREAD alert may be completely ignored.
 *
 * @param   {object}    peer        Peer object
 * @param   {string}    alert       Alert to apply (RINGING or UNREAD)
 */
function xows_gui_edit_alrt_set(peer, alert)
{
  // Get element
  const edit_alrt = xows_gui_doc(peer,"edit_alrt");

  const scroll = xows_gui_hist_scrl_get(peer);

  // If scroll is already almost at bottom we ignore the "UNREAD" alert
  if(scroll < 50 && alert === "UNREAD")
    return;

  // Add class
  edit_alrt.classList.add(alert);

  // Update status according scroll
  xows_gui_edit_alrt_update(peer, scroll, scroll);
}

/**
 * Removes alert status from the navigation bar.
 *
 * @param   {object}    peer        Peer object
 * @param   {string}    alert       Alert to reset (RINGING or UNREAD)
 */
function xows_gui_edit_alrt_reset(peer, alert)
{
  // Get element
  const edit_alrt = xows_gui_doc(peer,"edit_alrt");

  // Add class
  edit_alrt.classList.remove(alert);

  // Update status according scroll
  const scroll = xows_gui_hist_scrl_get(peer);
  xows_gui_edit_alrt_update(peer, scroll, scroll);
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
 * Stored input selection range
 */
let xows_gui_edit_inpt_rng = document.createRange();

/**
 * Stores current input selection range so it can be restored later
 */
function xows_gui_edit_inpt_sel_save()
{
  xows_gui_edit_inpt_rng = xows_doc_sel.getRangeAt(0);
}

/**
 * Restores previously saved input selection range. If saved range
 * is empty the caret is placed at end of input content.
 *
 * @param   {object}    event     Event object
 */
function xows_gui_edit_inpt_sel_load()
{
  const edit_inpt = xows_doc("edit_inpt");

  let rng = xows_gui_edit_inpt_rng;

  // Check whether saved range is within node
  if(!edit_inpt.contains(rng.commonAncestorContainer)) {
    // Create new selection range at end of input area
    rng = xows_gui_edit_inpt_rng = document.createRange();
    rng.selectNodeContents(edit_inpt);
    rng.collapse(start);
  }

  // Replace current range with saved one
  xows_doc_sel.removeAllRanges();
  xows_doc_sel.addRange(rng);
}

/**
 * Handles caret position changes within the Chat Editor input area.
 *
 * Notice that we use 'keyup' and 'mouseup' rather than 'keydown' and
 * 'mousedown' because browser set final selection range on key or button
 * release.
 *
 * @param   {object}    event     Event object
 */
function xows_gui_edit_inpt_oncaret(event)
{
  // We are only interested in caret navigation keys
  if(event.type === "keyup")
    if(event.keyCode < 35 || event.keyCode > 40) //< home; end; arrow keys
      return;

  // Save carret position
  xows_gui_edit_inpt_sel_save();
}
/**
 * Handle inputs in Chat Editor input to update caret position, send
 * writing status (chat states) and set or remove placeholder text.
 *
 * @param   {object}    event     Event object associated with trigger
 */
function xows_gui_edit_oninput(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Set composing
  if(xows_gui_peer)
    xows_cli_chst_set(xows_gui_peer, XOWS_CHAT_COMP);

  // Save carret position
  xows_gui_edit_inpt_sel_save();

  const edit_inpt = document.getElementById("edit_inpt");

  // Check inner text content to show placeholder
  if(edit_inpt.innerText.length < 2) {

    if(edit_inpt.innerText.trim().length === 0) {

      // Add CSS class to show placeholder
      edit_inpt.innerText = ""; //< Empty any residual <br>

      return; //< Return now
    }
  }
}

/**
 * Set focus and edit caret to chat message input
 */
function xows_gui_edit_inpt_setfocus()
{
  // Set input focus to message edit area
  xows_doc("edit_inpt").focus();
}

/**
 * Chat Message Edition validation (enter) function, called when user
 * press the Enter key (see xows_gui_wnd_onkey() function).
 *
 * @param   {object}    input     Input object to validate
 */
function xows_gui_edit_inpt_onenter(input)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(!xows_gui_peer)
    return;

  if(!input.innerText.length)
    return;

  const rply = xows_doc("edit_rply");

  // Send message
  xows_cli_msg_send(xows_gui_peer, input.innerText.trimEnd(), null, rply.dataset.id, rply.dataset.to);
  input.innerText = ""; //< Empty any residual <br>

  // Reset Reply data
  xows_gui_edit_rply_close();

  // Save carret position
  xows_gui_edit_inpt_sel_save();

  // Reset chatsate to active
  xows_cli_chst_set(xows_gui_peer, XOWS_CHAT_ACTI);
}

/**
 * Chat message Edition Paste event handling, caled when user
 * paste content from clipload into input area.
 *
 * @param   {object}    event     Clipboard event opbject
 */
function xows_gui_edit_inpt_onpaste(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(!xows_gui_peer)
    return;

  // Get clipboard raw text
  let text = event.clipboardData.getData("text");
  if(!text.length)
    return;

  // Prevent the default clipboard action
  event.preventDefault();

  // Set composing
  xows_cli_chst_set(xows_gui_peer, XOWS_CHAT_COMP);

  // Paste node in current selection range
  xows_doc_sel_paste(document.createTextNode(text));

  // Save caret position
  xows_gui_edit_inpt_sel_save();
}

/**
 * Chat Editor insert element at/within current/last selection
 *
 * If 'surround' parameter is defined, the inserted text is surrounded
 * by a node with the specified tagname. If 'editable" parameter is not set to
 * true, the inserted node cannot be edited and caret automatically jumps around.
 *
 * @param   {string}    text      Text to insert
 * @param   {string}   [surround]  Optional surrounding node tagname
 * @param   {string}   [editable] Optional set surrounding node as editable
 */
function xows_gui_edit_inpt_insert(text, surround, editable = false)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(!xows_gui_peer)
    return;

  const edit_inpt = document.getElementById("edit_inpt");

  // Create node to insert
  let node;

  if(surround) {

    node = document.createElement(surround);
    node.appendChild(document.createTextNode(text));

    // To prevent browser to allow writing within the node, we must
    // set the "contenteditable" attribute to false. This is especially
    // required for inserted emojis.
    if(!editable)
      node.setAttribute("contenteditable",false);

  } else {
    node = document.createTextNode(text);
  }

  // Load latest saved selection within input or set at end
  xows_gui_edit_inpt_sel_load();

  // Paste node in current selection range
  xows_doc_sel_paste(node);

  // Save caret position
  xows_gui_edit_inpt_sel_save();

  // Focus on input
  edit_inpt.focus();
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

/* -------------------------------------------------------------------
 * Emoji menu
 * -------------------------------------------------------------------*/
/**
 * Emojis Insertion Menu placement callback function
 *
 * @param   {element}    button   Menu button element
 * @param   {element}    menu     Menu (itself) element
 */
function xows_gui_emoj_menu_onshow(button, menu)
{
  // Calculate menu position next to button
  const rect = button.getBoundingClientRect();

  const style = window.getComputedStyle(menu);
  const marginBottom = parseInt(style.getPropertyValue("margin-bottom"));
  const marginRight = parseInt(style.getPropertyValue("margin-right"));

  menu.style.right = (window.innerWidth - (rect.right - marginRight)) + "px";
  menu.style.bottom = (window.innerHeight - (rect.top - marginBottom)) + "px";
}

/**
 * Emojis Insertion Menu on-click callback function
 *
 * @param   {object}    event     Event object
 */
function xows_gui_emoj_menu_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  if(event.target.tagName === "LI") {
    xows_gui_edit_inpt_insert(event.target.innerText, "EMO-JI", false); //< Insert selected Emoji
  } else if(event.target.id !== "emoj_clos") {
    return; //< prevent closing
  }

  // Set focus to Input
  xows_gui_edit_inpt_setfocus();

  // Close menu
  xows_doc_menu_close();
}
