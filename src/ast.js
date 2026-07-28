/**
 * Zolto AST Node Factory — Phase 3
 * Phase 1 : core Markdown blocks + inlines
 * Phase 2 : callouts · admonitions · reference links · figures ·
 *            definition lists · code metadata · extended inlines
 * Phase 3 : native block directives — embed · collapse · tabs · cards ·
 *            steps · columns · badge · tag · alert · timeline ·
 *            progress · avatar · icon
 */

// ═══ SHARED TYPE SETS ════════════════════════════════════════════════════════
export const CALLOUT_TYPES = new Set([
  'note','tip','warning','important','caution','danger',
  'info','success','check','bug','example','question',
  'abstract','todo','failure','seealso','summary','hint',
]);
export const ADMONITION_TYPES = new Set([
  ...CALLOUT_TYPES,'definition','theorem','proof','quote',
]);
export const PHASE3_NODE_TYPES = new Set([
  'embed','collapse','tabs','tab','card','card_group',
  'steps','step','columns','column','badge','tag',
  'alert','timeline','timeline_event','progress','avatar','icon',
]);
export const PHASE4_NODE_TYPES = new Set(['math_block', 'math_inline', 'math_ref']);
export const PHASE5_NODE_TYPES = new Set(['diagram', 'graph', 'node', 'edge', 'cluster', 'group']);
export const PHASE6_NODE_TYPES = new Set(['chart', 'chart_dataset', 'chart_series', 'chart_axis', 'chart_legend', 'chart_label', 'chart_scale', 'chart_grid', 'chart_tick', 'chart_marker']);
export const PHASE7_NODE_TYPES = new Set(['vector', 'vector_scene', 'vector_artboard', 'vector_layer', 'vector_group', 'vector_frame', 'vector_symbol', 'vector_use', 'vector_shape', 'vector_text', 'vector_image', 'vector_icon', 'vector_gradient', 'vector_pattern', 'vector_style', 'vector_marker']);
export const PHASE8_NODE_TYPES = new Set(['layout', 'layout_header', 'layout_main', 'layout_footer', 'layout_sidebar', 'layout_navigation', 'layout_section', 'layout_container', 'layout_spacer', 'layout_box', 'layout_grid', 'layout_cell', 'layout_flex', 'layout_item', 'layout_stack', 'layout_canvas', 'canvas_layer', 'canvas_object', 'layout_pages', 'layout_page', 'layout_presentation', 'layout_slide']);
export const PHASE9_NODE_TYPES = new Set(['component_def', 'component_use', 'template_def', 'template_use', 'slot_def', 'slot_outlet', 'macro_def', 'macro_use', 'conditional_block', 'loop_block', 'prop_list']);
export const PHASE10_NODE_TYPES = new Set(['interactive', 'form', 'input', 'textarea', 'button', 'checkbox', 'radio_group', 'radio_option', 'select', 'select_option', 'slider', 'toggle', 'segment', 'segment_item', 'progress', 'quiz', 'mcq', 'mcq_option', 'multi_choice', 'true_false', 'fill_blank', 'matching', 'match_pair', 'matrix', 'hint', 'explain', 'timer', 'flashcard_deck', 'flashcard', 'poll', 'poll_option', 'task_list', 'task_item', 'accordion', 'accordion_section', 'tabs_interactive', 'tab_interactive', 'state_block', 'state_var', 'shared_block', 'binding']);
export const PHASE11_NODE_TYPES = new Set(['animation_def', 'keyframes_def', 'keyframe_step', 'motion_token', 'transition_def', 'anim_timeline', 'anim_step', 'reveal_trigger', 'presentation', 'slide', 'speaker_note', 'animation_target', 'animation_group']);
export const PHASE12_NODE_TYPES = new Set(['plugin_manifest', 'plugin_dependency', 'plugin_permission', 'extension_point', 'registered_directive', 'registered_renderer', 'registered_theme', 'registered_data_provider', 'plugin_config', 'plugin_error']);
export const PHASE13_NODE_TYPES = new Set(['document_index', 'symbol_entry', 'diagnostic_entry', 'completion_item', 'hover_entry', 'refactor_action', 'formatter_hint', 'cache_entry', 'watch_event', 'tooling_state']);
export const PHASE14_NODE_TYPES = new Set(['collaboration_session', 'presence', 'cursor', 'selection', 'comment_thread', 'comment_reply', 'document_version', 'version_diff', 'branch', 'merge_request', 'workspace', 'project_package', 'publish_job', 'deployment_artifact', 'access_control_entry', 'audit_entry', 'sync_state', 'backup_snapshot']);
export const PHASE15_NODE_TYPES = new Set(['theme', 'theme_token', 'theme_palette', 'theme_variant', 'theme_override', 'theme_package', 'theme_state', 'accessibility_theme_preset']);






// ═══ BLOCK NODES — Phase 1 ═══════════════════════════════════════════════════
export function document(children=[],metadata={}){return{type:'document',children,metadata};}
export function heading(level,children=[],opts={}){return{type:'heading',level,id:opts.id??null,classes:opts.classes??[],children};}
export function paragraph(children=[]){return{type:'paragraph',children};}
export function horizontalRule(){return{type:'horizontal_rule'};}
export function blockquote(children=[]){return{type:'blockquote',children};}
export function list(ordered,items=[],opts={}){return{type:'list',ordered:!!ordered,start:opts.start??null,tight:opts.tight??true,children:items};}
export function listItem(children=[],opts={}){return{type:'list_item',checked:opts.checked??null,children};}
export function codeBlock(value='',opts={}){return{type:'code_block',lang:opts.lang??null,meta:opts.meta??null,value,title:opts.title??null,highlightLines:opts.highlightLines??[],lineNumbers:opts.lineNumbers??false,diff:opts.diff??false};}
export function table(head=[],rows=[],align=[],opts={}){return{type:'table',align,head,rows,caption:opts.caption??null};}
export function tableRow(cells=[]){return{type:'table_row',cells};}
export function tableCell(children=[],align=null){return{type:'table_cell',align,children};}
export function frontmatter(value='',data={}){return{type:'frontmatter',value,data};}
export function comment(value=''){return{type:'comment',value};}
export function importNode(path=''){return{type:'import',path};}
export function variableDef(name='',value=''){return{type:'variable_def',name,value};}
export function footnoteDef(id='',children=[]){return{type:'footnote_def',id,children};}
export function htmlBlock(value=''){return{type:'html_block',value};}

// ═══ BLOCK NODES — Phase 2 ═══════════════════════════════════════════════════
export function callout(calloutType='note',children=[],opts={}){return{type:'callout',calloutType:calloutType.toLowerCase(),title:opts.title??null,children};}
export function admonition(admonType='info',children=[],opts={}){return{type:'admonition',admonType:admonType.toLowerCase(),title:opts.title??null,children};}
export function referenceDef(id='',href='',title=null){return{type:'reference_def',id:id.toLowerCase(),href,title};}
export function figure(src='',alt='',opts={}){return{type:'figure',src,alt,title:opts.title??null,caption:opts.caption??null,lazy:opts.lazy??true,width:opts.width??null,height:opts.height??null};}
export function definitionList(items=[]){return{type:'definition_list',items};}
export function definitionItem(term='',defs=[]){return{type:'definition_item',term,defs};}

// ═══ BLOCK NODES — Phase 3 ═══════════════════════════════════════════════════

/** @embed image|video|audio|youtube|vimeo|figma|codepen|codesandbox|iframe */
export function embed(embedType='image',opts={}){
  return{type:'embed',embedType,src:opts.src??null,title:opts.title??null,alt:opts.alt??null,caption:opts.caption??null,width:opts.width??null,height:opts.height??null,lazy:opts.lazy??true,content:opts.content??null};
}
/** @collapse title="…" open=false */
export function collapse(title='',children=[],opts={}){
  return{type:'collapse',title,open:opts.open??false,children};
}
/** @tabs active=0 — contains tab[] */
export function tabs(items=[],opts={}){
  return{type:'tabs',active:opts.active??0,tabs:items};
}
/** @tab label="…" icon=… */
export function tab(label='',children=[],opts={}){
  return{type:'tab',label,icon:opts.icon??null,children};
}
/** @card [variant] title=… icon=… description=… href=… img=… */
export function card(opts={}){
  return{type:'card',variant:opts.variant??'default',title:opts.title??null,icon:opts.icon??null,description:opts.description??null,href:opts.href??null,img:opts.img??null,children:opts.children??[]};
}
/** @card-group cols=3 — contains card[] */
export function cardGroup(children=[],opts={}){
  return{type:'card_group',cols:opts.cols??3,children};
}
/** @steps — contains step[] */
export function steps(children=[]){return{type:'steps',children};}
/** @step title="…" icon=… */
export function step(title='',children=[],opts={}){
  return{type:'step',title,icon:opts.icon??null,children};
}
/** @columns gap=… — contains column[] */
export function columns(children=[],opts={}){
  return{type:'columns',gap:opts.gap??null,children};
}
/** @column width=… */
export function column(children=[],opts={}){
  return{type:'column',width:opts.width??null,children};
}
/** @badge [variant] icon=… outline=false pill=false */
export function badge(value='',opts={}){
  return{type:'badge',variant:opts.variant??'neutral',icon:opts.icon??null,outline:opts.outline??false,pill:opts.pill??false,value};
}
/** @tag color=… icon=… href=… */
export function tag(value='',opts={}){
  return{type:'tag',color:opts.color??null,icon:opts.icon??null,href:opts.href??null,value};
}
/** @alert [type] title=… icon=… dismissible=false */
export function alert(alertType='info',children=[],opts={}){
  return{type:'alert',alertType,title:opts.title??null,icon:opts.icon??null,dismissible:opts.dismissible??false,children};
}
/** @timeline — contains event[] */
export function timeline(children=[]){return{type:'timeline',children};}
/** @event title=… date=… icon=… */
export function timelineEvent(title='',children=[],opts={}){
  return{type:'timeline_event',title,date:opts.date??null,icon:opts.icon??null,children};
}
/** @progress value=0 max=100 label=… color=primary showPercent=false */
export function progress(value=0,opts={}){
  return{type:'progress',value:Number(value)||0,max:opts.max??100,label:opts.label??null,color:opts.color??'primary',showPercent:opts.showPercent??false};
}
/** @avatar src=… initials=… icon=… status=… size=md alt=… */
export function avatar(opts={}){
  return{type:'avatar',src:opts.src??null,initials:opts.initials??null,icon:opts.icon??null,status:opts.status??null,size:opts.size??'md',alt:opts.alt??null};
}
/** @icon [name] size=24 color=… label=… */
export function icon(name='',opts={}){
  return{type:'icon',name,size:opts.size??null,color:opts.color??null,label:opts.label??null};
}

// ═══ BLOCK NODES — Phase 4 (Mathematics) ═════════════════════════════════════

/**
 * `@math name="…" label="…" env=… numbered=true … @/math`
 * @param {string}      content     Raw math source (LaTeX-like)
 * @param {object|null} mathAst     Parsed tree from math-parser.js (mEquation/mEquationGroup root)
 */
export function mathBlock(content = '', mathAst = null, opts = {}) {
  return {
    type:        'math_block',
    content,
    ast:         mathAst,
    env:         opts.env ?? 'equation',
    display:     'block',
    numbered:    opts.numbered ?? true,
    label:       opts.label ?? null,
    number:      opts.number ?? 0,
    title:       opts.title ?? null,
    parseErrors: opts.parseErrors ?? [],
  };
}

/** Inline `$…$` math span. */
export function mathInline(content = '', mathAst = null, opts = {}) {
  return {
    type:        'math_inline',
    content,
    ast:         mathAst,
    display:     'inline',
    parseErrors: opts.parseErrors ?? [],
  };
}

/** `@ref(eq:label)` cross-reference to a numbered equation. */
export function mathRef(refId = '') {
  return { type: 'math_ref', refId };
}

// ═══ INLINE NODES — Phase 1 ══════════════════════════════════════════════════
export function text(value=''){return{type:'text',value};}
export function bold(children=[]){return{type:'bold',children};}
export function italic(children=[]){return{type:'italic',children};}
export function inlineCode(value=''){return{type:'inline_code',value};}
export function strikethrough(children=[]){return{type:'strikethrough',children};}
export function link(href='',children=[],title=null){return{type:'link',href,title,children};}
export function image(src='',alt='',titleOrOpts=null){const isOpts=titleOrOpts!==null&&typeof titleOrOpts==='object';const title=isOpts?(titleOrOpts.title??null):titleOrOpts;const opts=isOpts?titleOrOpts:{};return{type:'image',src,alt,title,lazy:opts.lazy??true,width:opts.width??null,height:opts.height??null};}
export function linebreak(){return{type:'linebreak'};}
export function softbreak(){return{type:'softbreak'};}
export function variableRef(name=''){return{type:'variable_ref',name};}
export function footnoteRef(id='',index=0){return{type:'footnote_ref',id,index};}

// ═══ INLINE NODES — Phase 2 ══════════════════════════════════════════════════
export function superscript(children=[]){return{type:'superscript',children};}
export function subscript(children=[]){return{type:'subscript',children};}
export function highlight(children=[]){return{type:'highlight',children};}
export function kbd(value=''){return{type:'kbd',value};}
export function htmlEntity(raw=''){return{type:'html_entity',raw};}
export function refLink(id='',children=[]){return{type:'ref_link',id:id.toLowerCase(),children};}

export const INLINE_TYPES=new Set(['text','bold','italic','inline_code','strikethrough','link','image','linebreak','softbreak','variable_ref','footnote_ref','superscript','subscript','highlight','kbd','html_entity','ref_link','math_inline','math_ref']);
