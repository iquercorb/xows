/*
 * @licstart
 *                    X.O.W.S - XMPP Over WebSocket
 *                        v0.9.0 - (Jan. 2021)
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
 *                 Copyright (c) 2020 - 2021 Eric M.
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
 
/* ------------------------------------------------------------------
 * 
 *                         XML API Module
 * 
 * ------------------------------------------------------------------ */
 
/**
 * DOM Parser object to parse XML data.
 */
const xows_xml_parser = new DOMParser();

/**
 * XML DOM object to create XML nodes.
 */
const xows_xml_doc = document.implementation.createDocument("jabber:client","Xows");

/**
 * Correspondence map to escape XML reserved characters.
 */
const XOWS_XML_ESCAP_MAP = {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&apos;","\"":"&quot;"};

/**
 *  Correspondence map to unescape and XML string.
 */
const XOWS_XML_UNESC_MAP = {"&amp;":"&","&lt;":"<","&gt;":">","&apos;":"'","&quot;":"\""};

/**
 * Remplacement function for XML string escape.
 */
function xows_xml_escap_fnc(m) {return XOWS_XML_ESCAP_MAP[m];}

/**
 * Rewrites the given string with XML escapes for reserved characters.
 * 
 * @param   {string}  str   String to be escaped.
 * 
 * @return  {string}  Escaped string.
 */
function xows_xml_escape(str) 
{
  return str.replace(/[\&<>'"]/g, xows_xml_escap_fnc);
}

/**
 *  Remplacement function for XML string unescape.
 */
function xows_xml_unesc_fnc(m) {return XOWS_XML_UNESC_MAP[m];}

/**
 * Rewrites the given XML escaped string with proper ASCII charaters.
 * 
 * @param   {string} str    String to be unescaped.
 * 
 * @return  {string} Unescaped string.
 */
function xows_xml_unesc(str) 
{
  return str.replace(/\&\w*;/g, xows_xml_unesc_fnc);
}

/**
 * Add the given children data to the specified node.
 * 
 * The children data can be a single XML Element object, a DOMString, 
 * or an Array of the previous types.
 * 
 * @param   {object}              parent  Parent XML element object.
 * @param   {(object|string|[])}  child   Data to append as child.
 */
function xows_xml_parent(parent, child)
{
  // Check child data type to create proper node type
  if(typeof(child) === "string" || typeof(child) === "number") {
    
    // Child data is a string or number, create text 
    parent.appendChild(xows_xml_doc.createTextNode(child));
  
  } else if(typeof(child) === "object") {
    
    // Child data is an object, check whether this is an Array()
    const n = child.length;
    if(n !== undefined) {
      
      // Child data is an Array(), process each element
      for(let i = 0; i < n; ++i) 
        xows_xml_parent(parent, child[i]); 
      
    } else {
      
      // Child data is a single object, append it
      parent.appendChild(child);
    }
  }
}

/**
 * Creates an XML Element object with the specified attributes and 
 * children data.
 * 
 * The children data can be a single XML Element object, a DOMString, 
 * or an Array of the previous types.
 * 
 * @param   {string}              name    Tag name.
 * @param   {object}              attr    Optional attributes as dictionary.
 * @param   {(object|string|[])}  child   Optional childrend data.
 *                    
 * @return  {object} The created XML Element object.
 */
function xows_xml_node(name, attr, child)
{
  const node = xows_xml_doc.createElement(name);
  
  // Add attributes to node
  if(typeof(attr) === "object") {
    for(const k in attr) {
      if(attr.hasOwnProperty(k) && attr[k])
        node.setAttribute(k, attr[k]);
    }
  }
  
  // Append child to node, this may be recursive
  if(child) xows_xml_parent(node, child);

  return node;
}

/**
 * Replaces XML node child content by the given one.
 * 
 * The function search for a node with the specified Tag name within 
 * the given parent tree, if a node is found, its children are removed 
 * then replaced by the given one otherwise  a node is created with 
 * the given child.
 * 
 * @param   {object}              parent  Parent node where to search.
 * @param   {string}              name    Node Tag name to search.
 * @param   {object|string|[]}    child   Childrend data to set.
 *                    
 * @return  {object} The found or created XML node.
 */
function xows_xml_edit(parent, name, child)
{
  // search for alrady existing node
  node = parent.querySelector(name);

  if(node) {
    // Remove all children and parent the given one
    while(node.firstChild) node.removeChild(node.lastChild);
    xows_xml_parent(node, child);
  } else {
    // Create new node with child
    node = xows_xml_node(name, null, child);
  }
  
  // Alternative, more brutal way
    
  // if(node) node.parentNode.removeChild(node);
  // xows_xml_parent(parent, xows_xml_node(name, null, child));
  
  return node;
}

/**
 * Serialize an XML Element object tree.
 *  
 * @param   {object}  node    XML Element object tree.
 *                    
 * @return  {string}  Resulting string.
 */
function xows_xml_serialize(node) 
{
  let i, n, result = "<" + node.nodeName;

  // Append attributes list
  n = node.attributes.length;
  for(i = 0; i < n; ++i)
    result += " " + node.attributes[i].nodeName + "=\"" +
                    node.attributes[i].nodeValue + "\"";
  
  // Append children
  n = node.childNodes.length;
  if(n !== 0) {
    result += ">";
    for(i = 0; i < n; ++i) {
      if(node.childNodes[i].nodeType === 1) {
        //< node, this go recursive
        result += xows_xml_serialize(node.childNodes[i]); 
      } else {
        //< text or unknow
        result += xows_xml_escape(node.childNodes[i].nodeValue); 
      }
    }
    result += "</" + node.nodeName + ">";
  } else {
    result += "/>"; //< no child, close node
  }
  
  return result;
}

/**
 * Parse the supplied XML data string to DOM object.
 *  
 * @param   {string}  str    Input string to parse as XML.
 *                    
 * @return  {object} Resuling DOM object.
 */
function xows_xml_parse(str) 
{
  return xows_clean_dom(xows_xml_parser.parseFromString(str,"text/xml"));
}

/**
 * Get inner text of an XML node.
 *  
 * @param   {object}  node    XML Element object to get inner text.
 *                    
 * @return  {string} Node text content or empty string.
 */
function xows_xml_get_text(node) {

  if(!node) return ""; //< nothing to get
  
  const n = node.childNodes.length;

  // get text of a single node
  if(n === 0 && node.nodeType === 3) {
    return xows_xml_unesc(node.nodeValue);
  }
  
  // get text for multiple nodes
  let str = "";
  for(let i = 0; i < n; ++i) {
    if(node.childNodes[i].nodeType === 3) 
      str += node.childNodes[i].nodeValue;
  }
  
  return xows_xml_unesc(str);
}
