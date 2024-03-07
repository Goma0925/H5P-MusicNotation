/**
 * Returns the value at the given attribute dotted path
 * @param {Object} obj 
 * @param {string} path 
 * @returns 
 * 
 * e.g:
 * ```
 * const obj = {
 *  a: {
 *      b: {
 *          c: 123
*          }
 *      }
 *  }; 
 *  const nestedValue = getNestedProperty(obj, 'a.b.c');
 *  console.log(nestedValue); // Output: 123    
 * ```
 */
function getNestedProperty(obj, path) {
    const keys = path.split('.');
    let nestedObj = obj;
    for (const key of keys) {
        if (nestedObj && typeof nestedObj === 'object' && key in nestedObj) {
            nestedObj = nestedObj[key];
        } else {
            return undefined;
        }
    }
    return nestedObj;
}


/**
 * Mapping of the sematics.json's config attributes to the related DOM ID of the elements
 */
const configAttrsToDomIds = {
    // <Author editor attribute path>:<dom ID to toggle>
    "buttonVisibility.toggleSidebar": ["#toggleSidebar"],
    "buttonVisibility.tabButtonGroup.notationTabBtn": ["#notationTabBtn"],
    "buttonVisibility.tabButtonGroup.annotationTabBtn": ["#annotationTabBtn"],
    "buttonVisibility.playBtnGroup": ["#playBtn", "#rewindBtn"],
    "buttonVisibility.colorPickerBtn": ["#colorPickerBtn"],
    // Import/export group
    "buttonVisibility.importButtonGroup.importAudioFileBtn": ["#importAudioFileBtn"],
    "buttonVisibility.importButtonGroup.importXMLBtn": ["#importXMLBtn"],
    "buttonVisibility.importButtonGroup.exportFileBtn": ["#exportFileBtn"],
    "buttonVisibility.showBBDiv": ["#showBBDiv"],
    // Note group
    "buttonVisibility.noteGroup.breveNote": ["#breveNote"],
    "buttonVisibility.noteGroup.fullNote": ["#fullNote"],
    "buttonVisibility.noteGroup.halfNote": ["#halfNote"],
    "buttonVisibility.noteGroup.quarterNote": ["#quarterNote"],
    "buttonVisibility.noteGroup.eigthNote": ["#eigthNote"],
    "buttonVisibility.noteGroup.sixteenthNote": ["#sixteenthNote"],
    "buttonVisibility.noteGroup.thirtysecondNote": ["#thirtysecondNote"],
    // Dot group
    "buttonVisibility.dotGroup.oneDot": ["#oneDot"],
    "buttonVisibility.dotGroup.twoDot": ["#twoDot"],
    // Artic group
    "buttonVisibility.articGroup.staccatoBtn": ["#staccatoBtn"],
    "buttonVisibility.articGroup.tenutoBtn": ["#tenutoBtn"],
    "buttonVisibility.articGroup.marcatoBtn": ["#marcatoBtn"],
    "buttonVisibility.articGroup.accentBtn": ["#accentBtn"],
    // Mod group
    "buttonVisibility.modGroup.tupletBtn": ["#tupletBtn"],
    "buttonVisibility.modGroup.tieNotes": ["#tieNotes"],
    "buttonVisibility.modGroup.organizeBeams": ["#organizeBeams"],
}


/**
 * Applies visibility on/off to the editor buttons based on sematic.json config.
 * @param {HTMLDivElement} notationWidgetRoot Root DOM of each notation notation content widget.
 * @param {Object} config - Part of the config object from semantics.json.
 * 
 * Note:
 * The config object is a partial object under the `config.paragraphs[i]` object, which
 * ultimately comes from the sematics.json.
 * A single notation content type can have multiple paragraphs, and each paragraph
 * can have multiple notation widgets. The function is called for each notation.
 * Beware that the same config object is passed multiple times here
 * if multiple notation belongs to the same paragraph.
 */
export function toggleButtonVisiblity(notationWidgetRoot, config){
    // Determine the visiblity of each button element based on config
    // {[domIds: string]: isVisible: boolean}
    const buttonVisibility = {}
    for (const [attrPath, domIds] of Object.entries(configAttrsToDomIds)) {
        const isVisible = getNestedProperty(config, attrPath);
        if (isVisible === undefined){
            console.error(`Attribute "${attrPath}" wasn't found in config object. If you see this error, possible the semantics.json structure change. This can cause some button visiblity toggle to not work. \n ${JSON.stringify(config, null, 2)}\n`)
            continue;
        }
        // Note that a single config attribute can represent multiple dom elements.
        domIds.forEach((id)=>{
            buttonVisibility[id] = isVisible;
        })
    }

    // Apply visibility styles
    for (const [domId, isVisible] of Object.entries(buttonVisibility)) {
        // Double loop, as 
        const button = notationWidgetRoot.querySelector(domId);
        if (!button){
            console.error(`A button with selector "${domId}" could not be found under the node while setting the visibility based on configuration:\n`, notationWidgetRoot)
            continue;
        }
        if (!isVisible){
            button.style.display = "none";
        }
    }
}