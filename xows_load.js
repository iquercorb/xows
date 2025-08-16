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
 * Loader Module
 *
 * ---------------------------------------------------------------------------*/
/**
 * Incrementing variable for Loading-Task bit identifier
 */
let xows_load_next_bit = 0x1;

/**
 * Returns a valid unique Loading-Task bit identifier
 */
function xows_load_task_bit()
{
  const bit = xows_load_next_bit;
  xows_load_next_bit = bit << 1;
  return bit;
}

/**
 * Storage for Loading-Task per-Task functions
 */
const xows_load_task_db = new Map();

/**
 * Defines a function for the specified Loading-Task
 */
function xows_load_task_set(task, ontask)
{
  xows_load_task_db.set(task, ontask);
}

/**
 * Storage for Loading-Task per-Item stack
 */
const xows_load_item_stk = new Map();

/**
 * Add a Loading-Task for the given item.
 *
 * @parma   {object}    item      Loading task target item
 * @param   {number}    mask      Bitmask for loading tasks to initialize
 * @param   {function}  onload    Function to call once load finished
 * @param   {*}        [param]    Optional parameter to pass to Onload
 */
function xows_load_task_push(item, mask, onload, param)
{
  if(mask === 0) {
    onload(item, param);
    return;
  }

  let stack;

  if(xows_load_item_stk.has(item)) {

    // Check for alrady planed task
    if(item.load & mask) {
      xows_log(2,"load_task_push","Ignoring already planed tasks 0x"+item.load, item.addr || item.name);
      return;
    }

    xows_log(2,"load_task_push","Updating tasks mask 0x"+item.load+"|0x"+mask, item.addr || item.name);

    // Get existing stack
    stack = xows_load_item_stk.get(item);

  } else {

    xows_log(2,"load_task_push","Setting tasks mask 0x"+item.load+"|0x"+mask, item.addr || item.name);

    // Create new load stack for this item
    stack = [];
    xows_load_item_stk.set(item, stack);
  }

  // Apply loading mask
  item.load |= mask;

  // Add entry to item's loading stack
  stack.push({"mask":mask,"onload":onload,"param":param});

  // Check every mask bits to lauch proper configured task
  let bit = 0x1;
  do {

    if(mask & bit) {

      // Get task function for this bit
      const ontask = xows_load_task_db.get(bit);

      if(xows_isfunc(ontask)) {

        // Add timeout for item's task
        xows_load_timeout_run(item, bit);

        // Launch task function
        ontask(item);

      } else {
        // Something is not correct, either provided mask is invalid
        // or loading tasks functions were not properly pre-configured.
        xows_log(1,"load_task_push","No task for bit 0x"+bit, item.addr || item.name);
        // Set task as done already to prevent waiting infinitely
        xows_load_task_done(item, bit);
      }
    }

    bit = bit << 1;

  } while(bit != xows_load_next_bit);
}

/**
 * Set Loading-Task done for the specified item
 *
 * If all item's Loading-Task are done, the configured 'onload' function
 * is called.
 *
 * @parma   {object}    item      Loading task target item
 * @param   {number}    task      Loading task bit to validate
 */
function xows_load_task_done(item, task)
{
  xows_log(2,"load_task_done","Task 0x"+task+" done",item.addr || item.name);

  // Remove load task bit
  item.load &= ~task;

  // Clear timeout for item's task
  xows_load_timeout_clear(item, task);

  // Get item's loading stack
  const stack = xows_load_item_stk.get(item);
  if(!stack) {
   xows_log(1,"load_task_done","No stack for item",item.addr || item.name);
   return;
  }

  let entry = null;

  // Search for completed item's loading entry
  for(let i = 0; i < stack.length; ++i) {
    if((stack[i].mask & item.load) === 0) {
      entry = stack[i];   //< Store stack entry
      stack.splice(i, 1); //< Remove entry from stack
      break;
    }
  }

  // Check if item finished loading
  if(entry !== null) {

    // Check whether item's loading stack is empty
    if(!stack.length)
      xows_load_item_stk.delete(item);

    // Call configured onload
    entry.onload(item, entry.param);

    // Check for firing of onempty function
    xows_load_onempty_check();
  }
}

/**
 * Storage for Loading-Task Timeout handles
 */
const xows_load_timeout_stk = new Map();

/**
 * Run new Loading-Task timeout
 *
 * This creates a timeout for the specified Item Loadin-Task so if a Task is
 * not done before timeout, it is set as "done" anyway.
 *
 * This function is part of automated Loading-Task management and should not
 * be used alone outside this context.
 *
 * @parma   {object}    item      Loading task target item
 * @param   {number}    task      Loading task bit to validate
 * @param   {number}   [timeout]  Optional timeout value (miliseconds)
 */
function xows_load_timeout_run(item, task, timeout = 1000)
{
  let task_timeout_stk;

  // Check whether item has pending timeout
  if(xows_load_timeout_stk.has(item)) {

    // Get timeout handle map (per-task timeout handles) for this item
    task_timeout_stk = xows_load_timeout_stk.get(item);

    // Check whether timeout already pending for this task
    if(task_timeout_stk.has(task)) {

      // Reset current pending timeout
      clearTimeout(task_timeout_stk.get(task));
    }

  } else {

    // create new per-Task timeout stack (Map) for this item
    task_timeout_stk = new Map();
    xows_load_timeout_stk.set(item, task_timeout_stk);

  }

  // Add new pending timeout
  task_timeout_stk.set(task, setTimeout(xows_load_task_done, timeout, item, task));
}

/**
 * Clear Loading-Task timeout.
 *
 * This clears any pending timeout for the specified Item Loadin-Task.
 *
 * This function is part of automated Loading-Task management and should not
 * be used alone outside this context.
 *
 * @parma   {object}    item      Loading task target item
 * @param   {number}    task      Loading task bit to validate
 */
function xows_load_timeout_clear(item, task)
{
  // Check whether item has pending timeout
  if(xows_load_timeout_stk.has(item)) {

    // Get timeout handle map (per-task timeout handles) for this item
    const task_timeout_stk = xows_load_timeout_stk.get(item);

    // Check whether timeout already pending for this task
    if(task_timeout_stk.has(task)) {

      // Reset current pending timeout
      clearTimeout(task_timeout_stk.get(task));

      // Delete map entry
      task_timeout_stk.delete(task);

      // Check whether timeout stack is empty for item
      if(!task_timeout_stk.size) {
        xows_log(2,"load_timeout_clear","Clear timeout DB",item.addr || item.name);
        xows_load_timeout_stk.delete(item);
      }
    }

  } else {

    xows_log(1,"load_timeout_clear","No timeout DB",item.addr || item.name);
  }
}

/**
 * Dummy function for empty Loading-Task
 *
 * This function cas be used as dummy Loading-Task function for
 * cases where there is nothing to performs but wait for a
 * specific event to happen.
 */
function xows_load_await_task(item) { }

/* ---------------------------------------------------------------------------
 *
 * On-Empty Event Trigger Feature
 *
 * ---------------------------------------------------------------------------*/
/**
 * Storage for On-Empty process parameters.
 */
const xows_load_onempty_def = {onempty:null,hto:null,param:null};

/**
 * Set an On-Empty trigger function to be called once item loading
 * stack is empty.
 *
 * In case of loading error or mistake, the specified function is
 * called anyway after the specified timeout (in miliseconds).
 *
 * If 'timeout' is set to 0, the timeout mechanism is disabled and the
 * function called ONLY once and if item loading stack is empty.
 *
 * @parma   {number}    timeout   Timeout for fallback trigger
 * @param   {function}  onempty   Callback function to call
 * @param   {*}        [param]    Optional parameter to pass to callback
 */
function xows_load_onempty_set(timeout, onempty, ...param)
{
  if(xows_load_item_stk.size === 0) {
    xows_log(2,"load_onempty_set","Stack already empty",onempty.name);
    // Loading stack allready empty, skip waiting
    onempty(...param);
    return;
  }

  const def = xows_load_onempty_def;

  // Clear any pending timeout
  if(def.hto) {
    clearTimeout(def.hto);
    def.hto = null;
  }

  // Set callback and custom parameter
  def.param = param;
  def.onempty = onempty;

  // Fire new timeout
  if(timeout > 0)
    //def.hto = setTimeout(onempty, timeout, ...param);
    def.hto = setTimeout(xows_load_onempty_check, timeout, true);

  xows_log(2,"load_onempty_set","Configured onempty",def.onempty.name);
}

/**
 * Check whether item loading stack is empty then fire the
 * configured 'onempty' function if any.
 *
 * This function is part of automated On-Empty processing and has no
 * utility outside this context.
 *
 * @param   {boolean}   timeout   Indicate call come from timeout
 */
function xows_load_onempty_check(timeout)
{
  if(!xows_load_onempty_def.onempty)
    return;

  xows_log(2,"load_onempty_check","remain",xows_load_item_stk.size);

  // Check for empty stack to launch onempty
  if(timeout || xows_load_item_stk.size === 0) {

    const def = xows_load_onempty_def;

    // Clear pending timeout
    if(def.hto) {
      clearTimeout(def.hto);
      def.hto = null;
    }

    if(timeout)
      xows_log(1,"load_onempty_check","Timed out");

    const onempty = def.onempty;
    const param = def.param;

    // Reset parameters, BEFORE calling the onempty function since it may
    // configure another ontempty within.
    def.onempty = null;
    def.param = null;

    xows_log(2,"load_onempty_check","Fireing onempty",onempty.name);

    // Call defined callback
    onempty(...param);
  }
}
