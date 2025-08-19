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
 * XML Module
 *
 * ---------------------------------------------------------------------------*/

/**
 * Gobale reference to DOMParser object
 */
const xows_xml_parser = new DOMParser();

/**
 * Globale reference to XML Document to create XML nodes
 */
const xows_xml_doc = document.implementation.createDocument("jabber:client","Xows");

/**
 * Correspondence map to escape XML reserved characters
 */
const XOWS_XML_ESCAP_MAP = new Map([["&","&amp;"],["<","&lt;"],[">","&gt;"],["'","&apos;"],["\"","&quot;"],["\n","<br>"]]);

/**
 * Correspondence map to unescape and XML string
 */
const XOWS_XML_UNESC_MAP = new Map([["&amp;","&"],["&lt;","<"],["&gt;",">"],["&apos;","'"],["&quot;","\""]]);

/**
 * Remplacement function for XML string escape
 */
function xows_xml_escap_fn(m) {return XOWS_XML_ESCAP_MAP.get(m);}

/**
 * Rewrites the given string with XML escapes for reserved characters
 *
 * @param   {string}    str       String to be escaped
 *
 * @return  {string}    Escaped string
 */
function xows_xml_escape(str)
{
  return str.replace(/[\&<>'"]/g, xows_xml_escap_fn);
}

/**
 *  Remplacement function for XML string unescape
 */
function xows_xml_unesc_fn(m) {return XOWS_XML_UNESC_MAP.get(m);}

/**
 * Rewrites the given XML escaped string with proper ASCII charaters
 *
 * @param   {string}    str       String to be unescaped
 *
 * @return  {string}    Unescaped string
 */
function xows_xml_unesc(str)
{
  return str.replace(/\&\w*;/g, xows_xml_unesc_fn);
}

/**
 * Parents the given data to the specified node
 *
 * The 'child' parameter can be either a single XML Node, a string,
 * or an Array of the previously mentioned types.
 *
 * @param   {element}     parent    Parent node
 * @param   {*}           child     Data to parent
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
 * Builds up an XML Node.
 *
 * The 'attr' parameter can be null or a directory object whose properties
 * are node attributes with their corresponding values.
 *
 * The 'child' parameter can be either a single XML Node, a string,
 * or an Array of the previously mentioned types.
 *
 * @param   {string}    name    Tag name
 * @param   {object}   [attr]   Optional node attributes
 * @param   {*}        [child]  Optional node children
 *
 * @return  {element}   XML node
 */
function xows_xml_node(name, attr, child)
{
  const node = xows_xml_doc.createElement(name);

  // Add attributes to node
  if(typeof(attr) === "object") {
    for(const k in attr) {
      if(attr.hasOwnProperty(k) && attr[k] !== null && attr[k] !== undefined)
        node.setAttribute(k, attr[k]);
    }
  }

  // Append child to node, this may be recursive
  if(child) xows_xml_parent(node, child);

  return node;
}

/**
 * Serializes XML tree.
 *
 * Converts the specified XML node tree into XML sample string.
 *
 * @param   {element}   node    XML node
 *
 * @return  {string}    Resulting string
 */
function xows_xml_serialize(node)
{
  let result = "<" + node.nodeName;

  // Append attributes list
  for(let i = 0; i < node.attributes.length; ++i)
    result += " " + node.attributes[i].nodeName + "='" +
                    xows_xml_escape(node.attributes[i].nodeValue) + "'";

  // Append children
  const n = node.childNodes.length;
  if(n !== 0) {
    result += ">";
    for(let i = 0; i < n; ++i) {
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
 * Parses XML sample string.
 *
 * Converts the specified XML sample string into XML node tree.
 *
 * @param   {string}    str   Input string to parse as XML
 *
 * @return  {element}   XML node tree.
 */
function xows_xml_parse(str)
{
  return xows_xml_parser.parseFromString(str,"text/xml");
}

/**
 * Returns XML node inner text.
 *
 * @param   {object}    node      XML node.
 *
 * @return  {string}    Inner text.
 */
function xows_xml_innertext(node) {

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

/**
 * Find first child node with the specified namespace URI withn
 * the specified root node.
 *
 * @param   {element}   node      XML root node to search in
 * @param   {string}    uri       XML namespace URI to search for
 *
 * @return  {element}   XML node or null if not found
 */
function xows_xml_ns_select(root, uri)
{
  const nodes = root.querySelectorAll('*');

  for(let i = 0; i < nodes.length; ++i)
    if(nodes[i].namespaceURI === uri)
      return nodes[i];

  return null;
}

/**
 * Find all child nodes with the specified namespace URI withn
 * the specified root node.
 *
 * @param   {element}   node      XML root node to search in
 * @param   {string}    uri       XML namespace URI to search for
 *
 * @return  {element[]}   Array of XML nodes (may be empty)
 */
function xows_xml_ns_select_all(root, uri)
{
  const result = [];

  const nodes = root.querySelectorAll('*');

  for(let i = 0; i < nodes.length; ++i)
    if(nodes[i].namespaceURI === uri)
      result.push(nodes[i]);

  return result;
}


/**
 * Beautify tagname adding capitals and replacing minus "-" by
 * spaces.
 *
 * @param   {string}    name      Tagname to beautify
 *
 * @return  {string}    Beautified tagname
 */
function xows_xml_beatify_tag(name)
{
  // Replace all '-' by spaces
  const str = name.replace(/-/g, " ");
  // Capitalize first character and return (in the world of Javascript where
  // it is normal to create a string from a character, extract substring of the
  // rest, then concatenate strings back to a new string, to simply replace a
  // single character... Is it better to cry or laugh ?)
  return str[0].toUpperCase() + str.substring(1);
}
