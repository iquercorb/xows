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
 *                  Copyright (c) 2019-2025 Eric M.
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
/* ---------------------------------------------------------------------------
 *
 * GUI Module - Chat History
 *
 * ---------------------------------------------------------------------------*/
/* ---------------------------------------------------------------------------
 * Chat History - Scrolling management
 * ---------------------------------------------------------------------------*/
/**
 * Returns the Chat-History scroll position of the specified Peer's
 * chat interface.
 *
 * The returned scroll position is not the 'scrollTop' property but in
 * contrary the computed scroll position relative to bottom of client area.
 *
 * @param   {object}    peer      Peer object to get scroll value
 */
function xows_gui_hist_scrl_get(peer)
{
  // Returns current DOM element or offscreen dummy object ad-hoc propery
  if(peer === xows_gui_peer) {
    return document.getElementById("chat_hist").scrollBottom;
  } else {
    return parseInt(xows_doc_frag_db.get(peer.addr).getElementById("chat_hist").dataset.scrollbottom);
  }
}

/**
 * Moves to bottom the Chat-History scroll of the specified Peer's
 * chat interface.
 *
 * @param   {object}    peer      Peer object to get scroll value
 * @param   {boolean}  [smooth]   Perform smooth scroll
 */
function xows_gui_hist_scrl_down(peer, smooth = true)
{
  // Force update navigation bar
  xows_gui_edit_alrt_update(xows_gui_peer, 0, 0);

  if(peer === xows_gui_peer) {
    xows_doc_scroll_todown(document.getElementById("chat_hist"), smooth);
  } else {
    //xows_doc_frag_find(peer.addr,"chat_hist").dataset.scrollbottom = 0;
    xows_doc_frag_db.get(peer.addr).getElementById("chat_hist").dataset.scrollbottom = 0;
  }
}

/**
 * Stored setTimeout handle/reference for history fetch temporization
 */
let xows_gui_hist_fetch_hto = null;

/**
 * Handles Chat-History scroll events.
 *
 * This performs required actions according Chat-History scroll position
 * changes. This is trigger by user gesture, the related Peer is then assumed
 * to be the currently selected one.
 *
 * @param   {object}    event     Event object
 */
function xows_gui_hist_onscroll(event)
{
  if(!xows_gui_peer)
    return;

  const chat_hist = xows_doc("chat_hist");

  // If scroll near of top, set timeout to fetch history
  if(chat_hist.scrollTop <= 100) {

    // Set timeout to fetch older history
    if(!xows_gui_hist_fetch_hto)
      xows_gui_hist_fetch_hto = setTimeout(xows_gui_mam_fetch_older, xows_options.cli_archive_delay, xows_gui_peer);

  } else if(chat_hist.scrollTop > 100) {

    // Clear the fetch history timeout
    if(xows_gui_hist_fetch_hto) {
      clearTimeout(xows_gui_hist_fetch_hto);
      xows_gui_hist_fetch_hto = null;
    }
  }

  // Update Chat navigation banner according user scroll relative to bottom.
  // If scroll is far enough from bottom, show the "Back to recent" banner
  xows_gui_edit_alrt_update(xows_gui_peer, chat_hist.scrollBottom, chat_hist.clientHeight);
}

/* ---------------------------------------------------------------------------
 * Chat History - Messages Interactions
 * ---------------------------------------------------------------------------*/
/**
 * Handles Chat-History click events
 *
 * This detects click on messages actions buttons and performs required
 * actions accordingly.
 *
 * @param   {object}    event     Event object
 */
function xows_gui_hist_onclick(event)
{
  xows_cli_pres_show_back(); //< Wakeup presence

  // Check for click on embeded image
  if(event.target.tagName === "IMG") {
    // Open image viewer
    xows_doc_view_open(event.target);
    return;
  }

  // Check for closest <mesg-rply> parent
  const mesg_rply = event.target.closest("MESG-RPLY");
  if(mesg_rply) {
    // Highlight replied message
    xows_gui_hist_mesg_hligh(xows_gui_peer, mesg_rply.dataset.id);
    return;
  }

  // Check for closest <li-mesg> parent
  const li_msg = event.target.closest("LI-MESG");
  if(!li_msg)
    return;

  // Special behavior for mobile devices to allow message interaction
  if(event.type.startsWith("touch")) {

    // Unselect any previousely selected message
    const li_selected = xows_doc("hist_ul").querySelector("LI-MESG.SELECTED");
    if(li_selected) li_selected.classList.remove("SELECTED");

    // Select the 'touched' message
    if(li_msg) li_msg.classList.add("SELECTED");
  }

  // Check for click on <button> element
  if(event.target.tagName === "BUTTON") {

     // If button has a valid name, this is history message button
     if(event.target.name) {

      switch(event.target.name)
      {
      case "mesg_bt_edit":
        xows_gui_mesg_repl_dlg_open(li_msg);
        break;
      case "edit_bt_abort":
        xows_gui_mesg_repl_dlg_close(li_msg);
        break;
      case "edit_bt_valid":
        xows_gui_mesg_repl_dlg_valid(li_msg.querySelector("MESG-INPT"));
        break;

      case "mesg_bt_trsh":
        xows_gui_mesg_retr_dlg_open(li_msg);
        break;
      case "trsh_bt_abort":
        xows_gui_mesg_retr_dlg_abort(li_msg);
        break;
      case "trsh_bt_valid":
        xows_gui_mesg_retr_dlg_valid(li_msg);
        break;

      case "mesg_bt_rply":
        xows_gui_edit_rply_set(li_msg);
        break;
      }

      return;
    }
  }
}

/* ---------------------------------------------------------------------------
 * Chat History - Messages Management
 * ---------------------------------------------------------------------------*/
/**
 * Updates the Chat-History messages authors's visual content.
 *
 * This updates authors's avatar and nickname of all history messages to
 * reflects Peers current (updated) state.
 *
 * @param   {object}    peer      Peer object
 * @param   {object}    author    Author's Peer object to be updated
 */
function xows_gui_hist_update(peer, author)
{
  // If incoming message is off-screen we get history <div> and <ul> of
  // fragment history corresponding to contact
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  if(!hist_ul || !hist_ul.children.length)
    return;

  // Get peer ID
  const ident =  xows_cli_peer_iden(author);

  let i;

  // Set new content for all elements
  const from_nodes = hist_ul.querySelectorAll("MESG-FROM[data-peer='"+ident+"'],RPLY-FROM[data-peer='"+ident+"']");
  i = from_nodes.length;
  while(i--) if(author.name != from_nodes[i].innerText) from_nodes[i].innerText = author.name;

  if(!author.avat)
    return;

  // Retrieve or generate avatar CSS class
  const avat_cls = xows_tpl_spawn_avat_cls(author);

  // Set new CSS class to all corresponding elements
  const avat_nodes = hist_ul.querySelectorAll("MESG-AVAT[data-peer='"+ident+"'],RPLY-AVAT[data-peer='"+ident+"']");
  i = avat_nodes.length;
  while(i--) if(avat_cls != avat_nodes[i].className) avat_nodes[i].className = avat_cls;
}

/**
 * Updates the Chat-History messages state following connection resume.
 *
 * This marks as "sent failed" all the messages that cannot have been sent
 * during connection loss.
 *
 * @param   {object}    peer      Chat history Peer, Room or Contact
 */
function xows_gui_hist_resume(peer)
{
  // If incoming message is off-screen we get history <div> and <ul> of
  // fragment history corresponding to contact
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  if(!hist_ul || !hist_ul.children.length)
    return;

  const sent = hist_ul.querySelectorAll(".MESG-SENT");
  for(let i = 0; i < sent.length; ++i) {
    if(!sent[i].classList.contains("MESG-RECP"))
      sent[i].classList.add("MESG-FAIL");
  }
}

/**
 * Find Chat-History message element (<li-mesg>) matching the suplied
 * parameters.
 *
 * The 'id' parameter can be the XMPP message raw id, or the message's
 * Unique and Stable Stanza ID.

 * If 'tomb' parameter is set to true and the specified message was not found,
 * a dummy tombstone message element is returned.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Message id or Unique and Stable Stanza ID
 * @param   {string}   [from]     Optional message author JID
 * @param   {boolean}  [tomb]     Optional returns tombstone on fail
 */
function xows_gui_hist_mesg_find(peer, id, from, tomb = false)
{
  let hist_ul;
  if(peer === xows_gui_peer) {
    hist_ul = document.getElementById("hist_ul");
  } else {
    hist_ul = xows_doc_frag_db.get(peer.addr).getElementById("hist_ul");
  }

  // First search by id attribute
  let li_msg = hist_ul.querySelector("LI-MESG[data-id='"+id+"']");

  // If no id attribute matches, search for Unique and Stable Stanza IDs (XEP-0359)
  if(!li_msg) {
    if(peer.type === XOWS_PEER_ROOM) {
      li_msg = hist_ul.querySelector("LI-MESG[data-szid='"+id+"']");
    } else {
      li_msg = hist_ul.querySelector("LI-MESG[data-orid='"+id+"']");
    }
  }

  // No message found, generates tombstone message as requested
  if(tomb && !li_msg)
    li_msg = xows_tpl_mesg_null_spawn(id, from, xows_l10n_get("The message is unreachable"));

  return li_msg;
}

/* ---------------------------------------------------------------------------
 * Chat History - History Modification (Message deletion, correction etc.)
 * ---------------------------------------------------------------------------*/
/**
 * Performs Chat-History message replacement for Message-Correction
 * instruction.
 *
 * This inserts the corrected (replacement) message into History, discards
 * (actually hides) the replaced message, then changes all references (reply-to,
 * quote, etc.) to replaced message.
 *
 * @param   {object}    peer        Peer object
 * @param   {element}   li_old      Replaced message <li-mesg> element
 * @param   {element}   li_new      New message <li-mesg> element
 *
 * @return  {element}   Inserted message element
 */
function xows_gui_hist_mesg_repl(peer, li_old, li_new)
{
  // Discard old message
  li_old.hidden = true;
  li_old.innerHTML = "";

  const hist_ul = xows_gui_doc(peer, "hist_ul");

  const old_id = xows_tpl_mesg_bestref(peer, li_old);

  // Search for references to old message to be updated
  const li_refs = hist_ul.querySelectorAll("MESG-RPLY[data-id='"+old_id+"']");
  for(let i = 0; i < li_refs.length; ++i)
    xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_new);

  // Also check chat input reply reference
  const edit_rply = xows_gui_doc(peer,"edit_rply");
  if(edit_rply.dataset.id === old_id)
    edit_rply.dataset.id = xows_tpl_mesg_bestref(peer, li_new);

  // Insert replacement message to list
  return hist_ul.insertBefore(li_new, li_old.nextSibling);
}

/**
 * Performs Chat-History message discard for Message-Retraction instruction.
 *
 * This discards (actually hides) the rectracted message then update all
 * references to that messages to insert tombstones.
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Message Unique and Stable ID to retract
 */
function xows_gui_hist_mesg_retr(peer, usid)
{
  // Retreive message element
  const li_msg = xows_gui_hist_mesg_find(peer, usid);

  if(!li_msg) {
    xows_log(1,"gui_hist_mesg_retract","retracted message not found",usid);
    return;
  }

  // Discard message
  li_msg.hidden = true;
  li_msg.innerHTML = "";

  // Search for references to message to be updated
  const li_refs = xows_gui_doc(peer,"hist_ul").querySelectorAll("MESG-RPLY[data-id='"+usid+"']");

  if(li_refs.length) {
    // Create temporary Null dummy message
    const li_tomb = xows_tpl_mesg_null_spawn(usid,"",xows_l10n_get("The message was deleted"));
    // Update messages with reply
    for(let i = 0; i < li_refs.length; ++i)
      xows_tpl_mesg_update(li_refs[i].closest("LI-MESG"), peer, null, null, li_tomb);
  }

  // If next message is same author, adjust the "Append" style
  const next_li = li_msg.nextSibling;
  if(next_li) {
    if(next_li.dataset.from === li_msg.dataset.from)
      next_li.classList.toggle("MESG-APPEND", li_msg.classList.contains("MESG-APPEND"));
  }
}

/**
 * Highlights the Chat-History message element matching supplied ID.
 *
 * This add HIGHLIGHT style to the message element and moves the Chat-History
 * scroll to that element.
 *
 * @param   {object}    peer      Peer object to get scroll value
 * @param   {object}    id        Message ID or Unique and Stable ID
 */
function xows_gui_hist_mesg_hligh(peer, id)
{
  // Search for already focus message
  const hig_li = xows_gui_doc(peer,"hist_ul").querySelector(".HIGHLIGHT");
  if(hig_li) hig_li.classList.remove("HIGHLIGHT");

  if(!id) return;

  // Retreive message element
  const li_msg = xows_gui_hist_mesg_find(peer, id);
  if(!li_msg) return;

  // Add focus class
  li_msg.classList.add("HIGHLIGHT");

  if(peer === xows_gui_peer) {
    // Scroll to element if necessary
    if((li_msg.offsetTop - xows_doc("chat_main").scrollTop) < 0)
      li_msg.scrollIntoView({behavior:"smooth",block:"center"});
  }
}

/**
 * Stored reference to last rised Peer (to avoid unnecessary processing)
 */
let xows_gui_hist_last_rise = null;

/**
 * Handles received Chat-History message related to Peer (forwarded from CLI
 * Module)
 *
 * Notice that message author may not be the related Chat-History Peer itself,
 * since it can be a MUC Room (in this case autor is a MUC Occupant) or the
 * user itself, receiving "echo" of its sent message.
 *
 * @param   {object}    peer      Peer object
 * @param   {object}    mesg      Message object
 * @param   {boolean}   wait      Message wait for receipt
 * @param   {boolean}   self      Message is an echo of one sent by user itself
 * @param   {object}    error     Error data if any
 */
function xows_gui_hist_onrecv(peer, mesg, wait, self, error)
{
  // Check for error message
  if(error) {
    // Find corresponding erroneous message according Id
    const err_li = xows_gui_hist_mesg_find(peer, mesg.id);
    // Mark message as failed
    if(err_li) err_li.classList.add("MESG-FAIL");
    // Print warning log
    xows_log(1,"gui_cli_onmessage","message error",error.name);
    return;
  }

  // MUC specific, we may receive message from ourself as confirmation
  // of reception with server additionnal data
  if(peer.type === XOWS_PEER_ROOM) {
    // Message to update
    const upd_li = xows_gui_hist_mesg_find(peer, (mesg.orid ? mesg.orid : mesg.id));
    if(upd_li) {
      xows_tpl_mesg_update(upd_li, peer, mesg, true);
      return;
    }
  }

  let li_rep, li_rpl;

  // Search for corrected message to be discarded
  if(mesg.repl) {
    li_rep = xows_gui_hist_mesg_find(peer, mesg.repl);
    // We ignore correction which are not in visible history or if correction
    // message have no body, in this case this mean message deletion
    if(!li_rep) return;
  }

  // Search for replied message to be referenced
  if(mesg.rpid)
    li_rpl = xows_gui_hist_mesg_find(peer, mesg.rpid, mesg.rpto, true);

  const hist_ul = xows_gui_doc(peer, "hist_ul");

  // Get last valid (non discarded) previous message
  let li_prv = hist_ul.lastElementChild;
  while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

  // Create new message element
  const li_msg = xows_tpl_mesg_spawn(peer, mesg, wait, li_prv, li_rep, li_rpl);

  // Insert or append message, depending whether li_ref is null
  if(li_rep) {
    xows_gui_hist_mesg_repl(peer, li_rep, li_msg);
  } else {
    hist_ul.appendChild(li_msg);
  }

  // Avoid notifications for correction messages and ourself
  if(!mesg.repl && !peer.self) {

    let alert = true;

    // For MUC we avoid notification unless explicit mention
    if(peer.type === XOWS_PEER_ROOM) {
      if(!(mesg.rpto && xows_cli_occu_self(peer).addr === mesg.rpto))
        alert = false;
    }

    // If offsecreen peer, add an Unread messag notification
    if(alert && peer !== xows_gui_peer)
      xows_gui_badg_unrd_mesg(peer, mesg.id);

    // If GUI is not in focus, send browser Push Notification
    if(alert && !xows_gui_wnd_has_focus)
      xows_gui_wnd_noti_emit(peer, mesg.body);
  }

  // Signals something new appending to chat
  if(xows_gui_hist_scrl_get(peer) > 50) {
    if(self) {
      // Force scroll down
      xows_gui_hist_scrl_down(peer, false);
    } else {
      // Show the "unread" chat navigation signal
      xows_gui_edit_alrt_set(peer, "UNREAD");
    }
  }

  // Rise Peer in roster
  if(peer.type !== XOWS_PEER_ROOM && peer !== xows_gui_hist_last_rise) {
    xows_gui_rost_list_rise(peer);
    xows_gui_hist_last_rise = peer;
  }
}

/**
 * Handles received Message-Receipt related to Peer (forwarded from CLI
 * Module)
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    id        Receipt related message Id
 */
function xows_gui_hist_onrecp(peer, id)
{
  // Check whether message is from or to current chat contact
  const li_msg = xows_gui_hist_mesg_find(peer, id);
  if(li_msg) {
    li_msg.classList.add("MESG-RECP");
  } else {
    xows_log(1,"gui_cli_onreceipt","message not found",id);
  }
}

/**
 * Handles received Message-Retraction related to Peer (forwarded from CLI
 * Module)
 *
 * @param   {object}    peer      Peer object
 * @param   {string}    usid      Retracted message Unique and Stable ID
 */
function xows_gui_hist_onretr(peer, usid)
{
  xows_gui_hist_mesg_retr(peer, usid);
}

/* ---------------------------------------------------------------------------
 * Chat History - Message Archive Management (MAM)
 * ---------------------------------------------------------------------------*/
/**
 * Query arvhived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 * @param   {boolean}   newer     If true, fetch newer message instead of older
 * @param   {number}   [count]    Count of visible message to get
 */
function xows_gui_mam_query(peer, newer, count = 0)
{
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  let end, start = null; //< IMPORTANT, set null for logic purposes

  // Get start or end time depending after parameter, we get time
  // always 25 ms after or before to prevent received the last or
  // first message already in history.
  if(newer) {

    if(hist_ul.children.length)
      start = parseInt(hist_ul.lastElementChild.dataset.time) + 25;

  } else {

    const hist_beg = xows_gui_doc(peer,"hist_beg");

    // Check whether we already reached the first archived message
    if(hist_beg.className.length)
      return;

    if(hist_ul.children.length)
      end = parseInt(hist_ul.firstElementChild.dataset.time) - 25;
  }

  // If no count specified, set default
  if(count === 0)
    count = xows_options.cli_archive_count;

  // Fetch archived messages
  xows_cli_mam_fetch(peer, count, start, end, xows_gui_mam_parse);
}

/**
 * Fetch the newer available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_mam_fetch_newer(peer)
{
  xows_gui_mam_query(peer, true);
}

/**
 * Fetch older available archived messages for the specified Peer
 *
 * @param   {object}    peer      Peer object
 */
function xows_gui_mam_fetch_older(peer)
{
  let count = xows_options.cli_archive_count;

  // Check whether this is a fetch for newly joined Room
  if(peer.type === XOWS_PEER_ROOM && !peer.live) {

    // We need to subtract required count of history message by
    // those we already got from the server
    let count = xows_options.cli_archive_count;
    count -= xows_gui_doc(peer,"hist_ul").children.length;
  }

  if(count > 0)
    xows_gui_mam_query(peer, false, count);
}

/**
 * Handles received Chat-History archived messages related to Peer (forwarded
 * from CLI Module)
 *
 * @param   {object}    peer      Archive related peer (Contact or Room)
 * @param   {boolean}   newer     Result are newer rather than older
 * @param   {object[]}  result    Received archived messages
 * @param   {number}    count     Count of gathered true (visible) messages
 * @param   {boolean}   complete  Indicate results are complete (no remain)
 */
function xows_gui_mam_parse(peer, newer, result, count, complete)
{
  const hist_ul = xows_gui_doc(peer, "hist_ul");

  let li_ref = null;

  if(!newer)
    li_ref = hist_ul.firstElementChild; //< node to insert messages before

  const hist_beg = xows_gui_doc(peer, "hist_beg");

  let li_rep, li_rpl, li_prv, added = 0;

  const n = result.length;
  for(let i = 0; i < n; ++i) {

    const mesg = result[i];

    // Search for message retraction
    if(mesg.retr) {
      xows_gui_hist_mesg_retr(peer, mesg.retr);
      continue;
    }

    // Check whether message has body (this may be reciept or chatstate)
    if(!mesg.body) continue;

    // If message with id alread exists, skip to prevent double
    if(xows_gui_hist_mesg_find(peer, (mesg.orid ? mesg.orid : mesg.id)))
      continue;

    // Search for corrected message to be discarded
    if(mesg.repl) {
      li_rep = xows_gui_hist_mesg_find(peer, mesg.repl);
      if(!li_rep) continue; //< ignore correction which are not in visible history
    } else {
      li_rep = null;
    }

    // Search for reply/quoted message to be referenced
    if(mesg.rpid) {
      li_rpl = xows_gui_hist_mesg_find(peer, mesg.rpid, mesg.rpto, true);
    } else {
      li_rpl = null;
    }

    // Get last valid (non discarded) previous message
    while(li_prv && li_prv.hidden) li_prv = li_prv.previousSibling;

    // Create new message element
    const li_msg = xows_tpl_mesg_spawn(peer, mesg, false, li_prv, li_rep, li_rpl);

    if(li_rep) {
      // Message correction is insert after the corrected message
      xows_gui_hist_mesg_repl(peer, li_rep, li_msg);
    } else {
      // Insert or append message, depending whether li_ref is null
      li_prv = hist_ul.insertBefore(li_msg, li_ref);
    }

    // Increase added message count
    added++;
  }

  xows_log(2,"gui_mam_parse",added+" added messages for",peer.addr);

  // Checks whether we reached end or start of available history, so we
  // display the proper "bounding" elements.
  if(complete) {
    // We reached the oldest history message
    hist_beg.className = "HIST-START";
  }

  // Inform MAM loaded
  if(newer) {
    xows_load_task_done(peer, XOWS_FETCH_NEWR);
  } else {
    xows_load_task_done(peer, XOWS_FETCH_OLDR);
  }
}

/* ---------------------------------------------------------------------------
 * Chat History - Message Correction Dialog
 * ---------------------------------------------------------------------------*/
/**
 * Cancel Chat-History message correction.
 *
 * This closes the Message correction input dialog and reset related
 * parameters.
 *
 * @param   {element}     li_msg   Message element (<li-mesg>) or null
 */
function xows_gui_mesg_repl_dlg_close(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName !== "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("hist_mesg").querySelector(".MESG-EDITOR");
  }

  if(li_msg)
    xows_tpl_mesg_edit_remove(li_msg);
}

/**
 * Opens Chat-History message correction input dialog.
 *
 * @param   {element}   li_msg    Message element (<li-mesg>) to be corrected.
 */
function xows_gui_mesg_repl_dlg_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_repl_dlg_close();

  // Spawn <mesg-edit> instance next to <mesg-body>
  const mesg_edit = xows_tpl_mesg_edit_insert(li_msg);

  // Set caret and focus
  const mesg_inpt = mesg_edit.querySelector("MESG-INPT");
  xows_doc_sel_caret_within(mesg_inpt);
  mesg_inpt.focus();
}

/**
 * Validates Chat-History message correction.
 *
 * @param   {element}    inpt     Related input element (Correction dialog Input field).
 */
function xows_gui_mesg_repl_dlg_valid(inpt)
{
  // Retrieve the parent <li-mesg> element
  const li_msg = inpt.closest("LI-MESG");

  // Get input text
  const inpt_text = inpt.innerText.trimEnd();

  // Check for difference to prevent useless correction
  if(inpt_text !== li_msg.querySelector("MESG-BODY").dataset.raw) {
    // Get message reply
    const rply = li_msg.querySelector("MESG-RPLY");
    // Send message correction
    xows_cli_msg_send(xows_gui_peer, inpt_text, li_msg.dataset.id, rply.dataset.id, rply.dataset.to);
  }

  // Close editor
  xows_tpl_mesg_edit_remove(li_msg);
}

/* ---------------------------------------------------------------------------
 * Chat History - Message Retraction Dialog
 * ---------------------------------------------------------------------------*/
/**
 * Cancel Chat-History message retraction.
 *
 * @param   {element}   li_msg   Message element (<li-mesg>) or null
 */
function xows_gui_mesg_retr_dlg_abort(li_msg)
{
  // Check whether event directely reference object
  if(!li_msg || li_msg.tagName != "LI-MESG") {
    // We need to search any message in edit mode
    li_msg = xows_doc("hist_mesg").querySelector(".MESG-TRASH");
  }

  if(li_msg)
    xows_tpl_mesg_trsh_remove(li_msg);
}

/**
 * Opens Chat-History message retraction dialog
 *
 * @param   {element}   li_msg    Message element (<li-mesg>) to be retracted
 */
function xows_gui_mesg_retr_dlg_open(li_msg)
{
  // Close any previousely opened editor
  xows_gui_mesg_retr_dlg_abort();

  // Spawn <mesg-trsh> instance next to <mesg-body>
  xows_tpl_mesg_trsh_insert(li_msg);
}

/**
 * Validates Chat-History message retraction.
 *
 * @param   {element}   li_msg    Message element (<li-mesg>) to be retracted
 */
function xows_gui_mesg_retr_dlg_valid(li_msg)
{
  // Get most suitable Stanza reference ID, either Origin-Id, Stanza-Id or Id
  const usid = xows_tpl_mesg_bestref(xows_gui_peer, li_msg);

  // Send message retraction
  if(usid) xows_cli_msg_retr(xows_gui_peer, usid);
}

