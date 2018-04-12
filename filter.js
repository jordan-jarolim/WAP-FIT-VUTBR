// Global filter config
var actualFilterConfig = {};

/**
 * Compares two values as ints, determines if first one is bigger
 * @param {mixed} val1 
 * @param {mixed} val2 
 */
function isBigger(val1, val2) {
    return parseInt(val1) >= parseInt(val2);
}

/**
 * Compares two values as ints, determines if first one is smaller
 * @param {mixed} val1 
 * @param {mixed} val2 
 */
function isSmaller(val1, val2) {
    return parseInt(val1) <= parseInt(val2);
}

/**
 * Compares two values determines if they have the same value and type
 * @param {mixed} val1 
 * @param {mixed} val2
 */
function isSame(val1, val2) {
    return val1.toUpperCase() === val2.toUpperCase();
}

/**
 * Try to find var in array
 * @param {array} arr 
 * @param {string} val 
 */
function isInList(arr, val) {
    var index = arr.findIndex(function(elem) {
        return elem.toUpperCase() === val.toUpperCase();
    })

    if (index === -1){
        return false;
    }
    return true;
}

/**
 * Recursive method to find number in nested DOM elements and compare to value, if found, returns true
 * @param {DOM} root - actual node
 * @param {mixed} value - value to be compared
 * @param {function} op - operation(bigger/smaller)
 */
function tryToCompare(root, value1, value2 = null) {
    var val = false;
    if (root.firstElementChild) {
        var rootChildren = root.children;
        for (let k = 0; k < rootChildren.length; k++) {
            val = tryToCompare(rootChildren[k], value1, value2)
            if (val === true) {
                break;
            }
        }
    } else if ((value2 !== null && isBigger(root.innerHTML, value1) && isSmaller(root.innerHTML, value2)) || (value2 === null && isInList(value1, root.innerHTML))) {
        val = true;
    }
    return val;
}

/**
 * Generates select options if nested
 * @param {DOM} root - actual node
 * @param {array} finalArray - iterable list
 */
function getOptions(root, finalArray = []) {
    if (root.firstElementChild) {
        var rootChildren = root.children;
        for (let k = 0; k < rootChildren.length; k++) {
            finalArray = getOptions(rootChildren[k], finalArray);
        }
    } else {
        finalArray = finalArray.concat([root.innerText.toUpperCase()])
    }
    return finalArray;
}

/**
 * Get list of selected options from passed select
 * @param {element} sel 
 */
function getSelectedOptions(sel) {
    var opts = [],
      opt;
    var len = sel.options.length;
    for (var i = 0; i < len; i++) {
      opt = sel.options[i];
  
      if (opt.selected && opt.value !== '') {
        opts.push(opt.value);
      }
    }

  
    return opts;
  }

/**
 * Perform filtering itself
 * @param {event} event 
 * @param {object} initialConfig 
 * @param {list} items 
 */
function filter(event, initialConfig, items) {

    // Add new filter config
    actualFilterConfig[event.target.dataset.name] = {
        type: event.target.dataset.type,
        value: event.target.value
    }

    if(event.target.dataset.type === 'enum'){
        actualFilterConfig[event.target.dataset.name].value = getSelectedOptions(event.target)
    }

    // go through all items and set display property
    for (i = 0; i < items.length; i++) {
        // get children
        var children = items[i].children;
        var found = true;

        // go through children and find value
        for (j = 0; j < children.length; j++) {
            // get initialConfig for active child
            var descriptionFromInitialConfig = initialConfig.items.find(function (element) {
                return children[j].classList.contains(element.name);
            })

            // perform lookup
            if (descriptionFromInitialConfig.type === 'string') {
                if (actualFilterConfig.hasOwnProperty(descriptionFromInitialConfig.name) && children[j].innerHTML.toUpperCase().indexOf(actualFilterConfig[descriptionFromInitialConfig.name].value.toUpperCase()) === -1) {
                    found = false;
                }
            } else if (descriptionFromInitialConfig.type === 'enum') {
                if (actualFilterConfig.hasOwnProperty(descriptionFromInitialConfig.name) && actualFilterConfig[descriptionFromInitialConfig.name].value.length !== 0 && !tryToCompare(children[j], actualFilterConfig[descriptionFromInitialConfig.name].value)) {
                    found = false;
                }
            } else if (descriptionFromInitialConfig.type === 'numeric') {
                var fromValue = actualFilterConfig.hasOwnProperty(descriptionFromInitialConfig.name + '-from') && actualFilterConfig[descriptionFromInitialConfig.name + '-from'].value !== '' ? actualFilterConfig[descriptionFromInitialConfig.name + '-from'].value : Number.MIN_SAFE_INTEGER;
                var toValue = actualFilterConfig.hasOwnProperty(descriptionFromInitialConfig.name + '-to') && actualFilterConfig[descriptionFromInitialConfig.name + '-to'].value !== '' ? actualFilterConfig[descriptionFromInitialConfig.name + '-to'].value : Number.MAX_SAFE_INTEGER;
                if (!tryToCompare(children[j], parseInt(fromValue), parseInt(toValue))) {
                    found = false;
                }
            }
        }

        // decide if show/not show
        if (found) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
};

/**
 * Define user inputs
 * @param {object} config that defines lookup structure
 */
function customUserFilter(config) {
    var items = document.getElementById(config.container).getElementsByClassName(config.item);
    var element = document.createElement('div');
    element.classList.add('user-filter');
    var child = null;

    config.items.forEach(function (item, index) {
        if (item.type === 'string') {
            child = document.createElement('input');
            child.id = item.name + '-filter'
            child.setAttribute('data-type', item.type)
            child.setAttribute('data-name', item.name)
            child.setAttribute('placeholder', item.name)
            child.onkeyup = function (event) {
                filter(event, config, items);
            }


        } else if (item.type === 'numeric') {
            child = document.createElement('span')

            var from = document.createElement('input');
            from.id = item.name + '-filter-from'
            from.classList.add('numeric');

            from.setAttribute('data-type', item.type)
            from.setAttribute('data-name', item.name + '-from')
            from.setAttribute('placeholder', item.name + ' from')



            var to = document.createElement('input');
            to.id = item.name + '-filter-to'
            to.classList.add('numeric');

            to.setAttribute('data-type', item.type)
            to.setAttribute('data-name', item.name + '-to')
            to.setAttribute('placeholder', item.name + ' to')



            child.appendChild(from);
            child.appendChild(to);
            child.onkeyup = function (event) {
                filter(event, config, items);
            }

        } else {
            child = document.createElement("select");
            child.id = item.name + '-filter'
            child.setAttribute('data-type', item.type)
            child.setAttribute('data-name', item.name)
            child.multiple = true;

            // child.setAttribute('placeholder', item.name + ' from')
            child.onchange = function (event) {
                filter(event, config, items);
            }

            var option = new Option('genre', '');
            option.setAttribute('selected', true);

            child.options.add(option);

            var enumValues = [];
            for (i = 0; i < items.length; i++) {
                var tempItem = items[i].getElementsByClassName(item.name);
                if (tempItem.length && !enumValues.includes(tempItem[0].innerHTML.toUpperCase())) {
                    // are options nested?
                    if (tempItem[0].firstElementChild) {
                        var nestedOptions = getOptions(tempItem[0]);
                        enumValues = enumValues.concat(nestedOptions)
                    } else{
                        enumValues = enumValues.concat([tempItem[0].innerHTML.toUpperCase()])
                    }
                }
            }
            enumValues = enumValues.filter(function(item, pos) {
                return enumValues.indexOf(item) == pos;
            })
            enumValues.forEach(function (element, index) {
                option = new Option(element, element);
                child.options.add(option);
            })
        }
        element.appendChild(child)
    })

    document.getElementById(config.container).prepend(element);
}

