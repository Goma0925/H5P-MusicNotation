
import VerovioScoreEditor from 'vibe-editor';
import {
  jQuery as $, JoubelUI as UI, Question
}
  from "./globals";
import { uuidv4 } from 'vibe-editor/src/scripts/js/utils/random'


// CSS Classes
const MAIN_CONTAINER = 'h5p-analysis-score-input-field';
const INPUT_LABEL = 'h5p-analysis-score-input-field-label';
const INPUT_FIELD = 'h5p-analysis-score-input-field-textfield';
const WRAPPER_MESSAGE = 'h5p-analysis-score-input-field-message-wrapper';
const CHAR_MESSAGE = 'h5p-analysis-score-input-field-message-char';
const CHAR_MESSAGE_IMPORTANT = 'h5p-analysis-score-input-field-message-char-important';
const SAVE_MESSAGE = 'h5p-analysis-score-input-field-message-save';
const ANIMATION_MESSAGE = 'h5p-analysis-score-input-field-message-save-animation';
const EMPTY_MESSAGE = '&nbsp;';

export default class NoteInputField {
  /**
   * @constructor
   * @param {object} params - Parameters.
   * @param {number} [params.inputFieldSize] - Number of rows for inputfield.
   * @param {number} [params.maximumLength] - Maximum text length.
   * @param {string} [params.placeholderText] - Placeholder text for input field.
   * @param {string} [params.remainingChars] - Label for remaining chars information.
   * @param {string} [params.taskDescription] - Task description (HTML).
   * @param {object} [params.previousState] - Content state of previous attempt.
   * @param {object} [callbacks] - Callbacks.
   * @param {function} [callbacks.onInteracted] - Interacted callback.
   */
  constructor(params, callbacks) {
    var that = this;
    this.currentAttachedElement = undefined;
    this.usedIds = [];
    this.params = params;
    this.previousState = params.previousState || '';

    // Callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onInteracted = this.callbacks.onInteracted || (function () { });


    this.vseInstances = [];
    if(this.params.svgContainer){
      const parser = new DOMParser()
      this.scoreContainer = parser.parseFromString(this.params.svgContainer, "text/html")
      if(!this.scoreContainer.classList){
        this.scoreContainer = parser.parseFromString(this.scoreContainer.body.textContent, "text/html")
      }
      this.scoreContainer = this.scoreContainer.querySelector(".vse-container")
    }else{
      this.scoreContainer = document.createElement('div');
      this.scoreContainer.setAttribute('id', 'vseDesc-' + uuidv4());
    }
    this.setListeners()

    // InputField
    this.inputField = document.createElement('textarea');
    this.inputField.classList.add(INPUT_FIELD);
    this.inputField.classList.add("analysis-score-input")
    this.setText(this.previousState);
    this.oldValue = this.previousState;

    this.containsText = this.oldValue.length > 0;

    //notation
    this.notationData = this.params.notationScore
    //this.annotData = this.params.annotationField

    this.vseInstance = new VerovioScoreEditor(this.scoreContainer, { data: this.notationData }, this.meiCallback.bind(this));
    this.scoreContainer.addEventListener("loadingEnd", params.afterLoadCallback)
    
    this.content = document.createElement('div');
    this.content.appendChild(this.inputField);
    if(this.params.isContent !== false) this.content.appendChild(this.scoreContainer);
    
    this.vseInstances.push(this.vseInstance);

    var fullsizeBtn = document.createElement("button")
    fullsizeBtn.id = "fullscreenBtn_" + this.scoreContainer.id
    fullsizeBtn.classList.add("fullscreenBtn_")
    fullsizeBtn.textContent = "Fullscreen"
    this.inputField.parentElement.insertBefore(fullsizeBtn, this.inputField.parentElement.firstElementChild)

    parent.document.querySelectorAll("iframe").forEach(frame => {
      frame.setAttribute("allowfullscreen", "")
    })
    fullsizeBtn.addEventListener("click", this.setFullscreen.bind(this))
    this.scoreContainer.addEventListener("fullscreenchange", this.setFullscreenElements.bind(this))

    var elementSVG = document.createElement('img');
    this.content.appendChild(elementSVG);

    this.loadObservers()
  };


  setListeners() {
    var that = this
    //this.scoreContainer.addEventListener("vseInit", this.initialLoad.bind(this))
    this.scoreContainer.closest(".h5p-question-content")?.querySelectorAll("div > div").forEach(d => d.addEventListener("resize", this.adjustFrameFunction))
  }


  initialLoad() {
    this.usedIds.push(this.scoreContainer.id)
    this.scoreContainer.dispatchEvent(new Event("containerAttached"));
    this.rootSVG = this.scoreContainer.querySelector('#rootSVG');
    // var oldAnnotationCanvas = this.scoreContainer.querySelector("#annotationCanvas")
    // var newAnnotationCanvas = new DOMParser().parseFromString(this.params.notationScore.annotationFieldGroup, "text/html").body.childNodes[0]
    // newAnnotationCanvas = new DOMParser().parseFromString(newAnnotationCanvas.nodeValue, "image/svg+xml").children[0]

    // if (oldAnnotationCanvas === null) {
    //   this.scoreContainer.querySelector("#interactionOverlay").append(newAnnotationCanvas)
    // } else {
    //   oldAnnotationCanvas.replaceWith(newAnnotationCanvas)
    // }

    // newAnnotationCanvas.setAttribute("viewBox", this.scoreContainer.querySelector("#interactionOverlay").getAttribute("viewBox"))
    // this.vseInstance.getCore().getInsertModeHandler().getAnnotations().setAnnotationCanvas(newAnnotationCanvas)
  }

  /**
    * Load obeservers for changes in the dom, so that parameters of the vse can be updated 
    */
  loadObservers() {
    var that = this

    //reload the size of the svg in current slide, since the viewbox is initally 0 0 0 0
    var currentSlideObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === "class") {
          var target = mutation.target
          if (target.classList.contains("h5p-question-content")) {
            var vseContainer = target.querySelector(".vse-container")
            if (vseContainer === null) return
            that.vseInstances.forEach(vi => {
              if (vi.container.id === vseContainer.id) {
                var core = vi.getCore()
                core.loadData(core.getCurrentMEI(false), false).then(() => {
                  that.afterLoadCallback()
                  //that.adjustFrameResponsive()
                })
              }
            })
          }
        }
      })
    })

    document.querySelectorAll(".h5p-question-content").forEach(q => {
      currentSlideObserver.observe(q, {
        attributes: true
      })
    })


  };

  /**
     * Configure the vse parameters as given by the core interfacing methods
     * @param {*} vseInstance 
     */
  configureVSE(vseInstance) {
    this.vseInstance = vseInstance
    this.scoreContainer = document.getElementById(vseInstance.container.id)
    var core = this.vseInstance.getCore()
    var toolkit = core.getVerovioWrapper().getToolkit()

    toolkit.setOptions({ // here we could set some options for verovio if needed
      //pageWidth: vseContainer.getBoundingClientRect().width,
      adjustPageWidth: 1,
      adjustPageHeight: 1
    })
    core.loadData("", core.getCurrentMEI(false), false, "svg_output").then(() => {
      this.afterLoadCallback()
      this.adjustFrameResponsive(this.scoreContainer)
    })

  };

  /**
     * Adjust its contents when all content is loaded
     */
  adjustFrameResponsive(vseContainer) {

    var containerSVG = vseContainer.querySelector("#svgContainer")
    var containerHeight
    if (containerSVG !== null) {
      var vb = containerSVG.querySelector("#interactionOverlay").getAttribute("viewBox")?.split(" ").map(parseFloat)
      containerHeight = (vb[3] * 1.25).toString() + "px"
    }
    vseContainer.style.height = containerHeight || "20rem"
    vseContainer.style.width = "100%"
    //console.log(vseContainer.style.height);

    var h5pContainer = document.querySelector(".h5p-container")
    var showChildren = h5pContainer.querySelectorAll(".h5p-sc-set > *, .h5p-actions, .vse-container, .h5p-sc")
    var h5pContainerHeight = 0
    showChildren.forEach(sc => {
      h5pContainerHeight += sc.getBoundingClientRect().height
      sc.style.position = "relative" // very important, so that the containers are displayed in the same column
    })
    //h5pContainer.style.height =  h5pContainerHeight.toString() + "px"
    //console.log(h5pContainerHeight.toString());
    window.frameElement.style.height = vseContainer.style.height + "px"//h5pContainerHeight.toString() + "px"
    window.frameElement.style.resize = "auto"
  };
  adjustFrameFunction = this.adjustFrameResponsive.bind(this)

  setFullscreen(e) {
    if (document.fullscreenElement) {
      this.vseInstance.getCore().getVerovioWrapper().getToolkit().setOptions({
        adjustPageWidth: 1,
      })
      parent.document.exitFullscreen()
      var containerParent = this.scoreContainer
      while (containerParent) {
        containerParent.classList.remove("fullscreen")
        containerParent = containerParent.parentElement
      }
    } else {
      var containerParent = this.scoreContainer || this.vseInstance.container
      this.vseInstance.getCore().getVerovioWrapper().getToolkit().setOptions({
        adjustPageWidth: 0,
      })
      var userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes("apple") && !userAgent.includes("chrome")) {
        parent.document.webkitRequestFullscreen()
        while (containerParent) {
          containerParent.classList.add("fullscreen")
          containerParent = containerParent.parentElement
        }
      } else {
        console.log("containerparent", containerParent)
        containerParent.requestFullscreen()
        containerParent.classList.add("fullscreen")
      }
    }
  }

  setFullscreenElements(e) {
    var fullscreenBtn = this.scoreContainer.querySelector(".fullscreenBtn")
    if (this.scoreContainer.classList.contains("fullscreen")) {
      this.scoreContainer.classList.remove("fullscreen")
      if (fullscreenBtn !== null) { fullscreenBtn.classList.remove("transparent") }
    } 
    // else {
    //   this.scoreContainer.classList.add("fullscreen")
    //   if (fullscreenBtn !== null) { fullscreenBtn.classList.add("transparent") }
    // }
  }

  meiCallback() {
    var that = this
    //this.scoreContainer.querySelector("#" + this.vseInstance.getCore().getMouse2SVG().getLastMouseEnter().staff?.getAttribute("refId"))?.querySelectorAll(".wrong, .correct").forEach(el => {
      this.scoreContainer.querySelectorAll(".wrong, .correct").forEach(el => {
      el.classList.remove("wrong")
      that.scoreContainer.querySelector('[refId="' + el.id + '"]')?.classList.remove("wrong")
      el.classList.remove("correct")
      that.scoreContainer.querySelector('[refId="' + el.id + '"]')?.classList.remove("correct")
    })
  }

  /**
   * Get MEI for Analysis tasks
   * @returns 
   */
  getMei(asDocument = false) {
    return this.vseInstance.getCore()?.getCurrentMEI(asDocument)
  }

  getAnnotationSVG(){
    return this.scoreContainer.querySelector("#annotationCanvas")
  }

  /**
   * 
   */
  getTstamp(note) {
    return this.vseInstance.getCore().getLabelHandler().getTimestamp(note)
  }

  /**
   * Get introduction for H5P.Question.
   * @return {Object} DOM elements for introduction.
   */
  getIntroduction() {
    return this.taskDescription;
  };

  /**
   * Get content for H5P.Question.
   * @return {Object} DOM elements for content.
   */
  getContent() {
    return this.content;
  };

  getScoreContainer() {
    return this.scoreContainer
  }

  /**
   * Get current text in InputField.
   * @return {string} Current text.
   */
  getText() {
    return this.inputField.value;
  };

  disableInteraction() {
    this.vseInstance.getCore()?.setHideUI(true)
    this.vseInstance.getCore()?.reloadData()
    try{
      this.vseInstance.getCore().windowHandler?.removeListeners()
    }catch(error){
      //yeah just go on
    }
  }

  enableInteraction() {
    this.vseInstance.getCore()?.setHideUI(false)
    this.vseInstance.getCore()?.reloadData()
  }

  destroyVSEInstance(){
    this.vseInstance.getCore().windowHandler?.removeListeners() // for some reason this listeners still stays with 
    this.vseInstance = null
    delete this.vseInstance
  }
  /**
   * Disable the inputField.
   */
  disable() {
    this.inputField.disabled = true;
  };

  /**
   * Enable the inputField.
   */
  enable() {
    this.inputField.disabled = false;
  };

  /**
   * Enable the inputField.
   */
  focus() {
    this.inputField.focus();
  };

  /**
   * Set the text for the InputField.
   * @param {string|Object} previousState - Previous state that was saved.
   */
  setText(previousState) {
    if (typeof previousState === 'undefined') {
      return;
    }
    if (typeof previousState === 'string') {
      this.inputField.innerHTML = previousState;
    }
    if (typeof previousState === 'object' && !Array.isArray(previousState)) {
      this.inputField.innerHTML = previousState.inputField || '';
    }
  };

  /**
   * Compute the remaining number of characters.
   * @return {number} Number of characters left.
   */
  /*function computeRemainingChars() {
    return this.params.maximumLength - this.inputField.value.length;
  };*/

  /**
   * Update character message field.
   */
  updateMessageChars() {
    /*if (!this.params.statusBar) {
      return;
    }*/

    /*if (typeof this.params.maximumLength !== 'undefined') {
      this.setMessageChars(this.params.remainingChars.replace(/@chars/g, this.computeRemainingChars()), false);
    }
    else {
      // Use EMPTY_MESSAGE to keep height
      this.setMessageChars(EMPTY_MESSAGE, false);
    }*/
  };

  /**
   * Update the indicator message for saved text.
   * @param {string} saved - Message to indicate the text was saved.
   */
  updateMessageSaved(saved) {
    /* if (!this.params.statusBar) {
       return;
     }*/

    // Add/remove blending effect
    if (typeof saved === 'undefined' || saved === '') {
      this.statusSaved.classList.remove(ANIMATION_MESSAGE);
      //this.statusSaved.removeAttribute('tabindex');
    }
    else {
      this.statusSaved.classList.add(ANIMATION_MESSAGE);
      //this.statusSaved.setAttribute('tabindex', 0);
    }
    this.statusSaved.innerHTML = saved;
  };

  /**
   * Set the text for the character message.
   * @param {string} message - Message text.
   * @param {boolean} important - If true, message will added a particular CSS class.
   */
  setMessageChars(message, important) {
    /*if (!this.params.statusBar) {
      return;
    }*/

    if (typeof message !== 'string') {
      return;
    }

    if (message === EMPTY_MESSAGE || important) {
      /*
       * Important messages should be read for a readspeaker by caller and need
       * not be accessible when tabbing back again.
       */
      this.statusChars.removeAttribute('tabindex');
    }
    else {
      this.statusChars.setAttribute('tabindex', 0);
    }

    this.statusChars.innerHTML = message;
    if (important) {
      this.statusChars.classList.add(CHAR_MESSAGE_IMPORTANT);
    }
    else {
      this.statusChars.classList.remove(CHAR_MESSAGE_IMPORTANT);
    }
  };

  setAfterLoadCallback(callback){
    this.afterLoadCallback = callback
  }

}