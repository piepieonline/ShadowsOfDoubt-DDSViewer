window.templates = {};

window.templates.tree = {
    "document": {
        "background": "",
        "colour": {
            "a": 0.0,
            "b": 0.0,
            "g": 0.0,
            "r": 0.0
        },
        "fill": 1,
        "size": {
            "x": 0.0,
            "y": 0.0
        }
    },
    "id": "DEFAULT_GUID",
    "messages": [

    ],
    "name": "DEFAULT_NAME",
    "participantA": {
        "connection": 15,
        "disableInbox": false,
        "jobs": [
        ],
        "required": true,
        "traitConditions": 0,
        "traits": [
        ],
        "triggers": [
        ],
        "useJobs": false,
        "useTraits": false
    },
    "participantB": {
        "connection": 15,
        "disableInbox": false,
        "jobs": [
        ],
        "required": true,
        "traitConditions": 0,
        "traits": [
        ],
        "triggers": [
        ],
        "useJobs": false,
        "useTraits": false
    },
    "participantC": {
        "connection": 15,
        "disableInbox": false,
        "jobs": [
        ],
        "required": false,
        "traitConditions": 0,
        "traits": [
        ],
        "triggers": [
        ],
        "useJobs": false,
        "useTraits": false
    },
    "participantD": {
        "connection": 15,
        "disableInbox": false,
        "jobs": [
        ],
        "required": false,
        "traitConditions": 0,
        "traits": [
        ],
        "triggers": [
        ],
        "useJobs": false,
        "useTraits": false
    },
    "priority": 3,
    "repeat": 1,
    "startingMessage": "DEFAULT_GUID_MESSAGE_1_INSTANCE",
    "stopMovement": true,
    "treeChance": 1.0,
    "treeType": 1,
    "triggerPoint": 3
}

window.templates.treeMessage = {
    "alignH": 0,
    "alignV": 0,
    "charSpace": 0.0,
    "col": {
        "a": 1.0,
        "b": 0.0,
        "g": 0.0,
        "r": 0.0
    },
    "elementName": "",
    "font": "Halogen",
    "fontSize": 22,
    "fontStyle": 0,
    "instanceID": "DEFAULT_GUID",
    "lineSpace": 16,
    "links": [
    ],
    "msgID": "DEFAULT_GUID",
    "order": 0,
    "paraSpace": 0.0,
    "pos": {
        "x": -30.0,
        "y": -175.0
    },
    "rot": 0.0,
    "saidBy": 0,
    "saidTo": 1,
    "size": {
        "x": 320.0,
        "y": 300.0
    },
    "usePages": false,
    "wordSpace": 0.0
}

window.templates.treeMessageLinks = {
    "from": "",
    "to": "",
    "delayInterval": {
        "x": 0,
        "y": 0.01
    },
    "useWeights": false,
    "choiceWeight": 0.5,
    "useKnowLike": false,
    "know": 0.5,
    "like": 0.5,
    "useTraits": false,
    "traits": [],
    "traitConditions": 0
}

window.templates.message = {
    "blocks": [
    ],
    "id": "DEFAULT_GUID",
    "name": "DEFAULT_NAME"
}

window.templates.messageBlock = {
    "alwaysDisplay": true,
    "blockID": "DEFAULT_GUID",
    "forceScope": 0,
    "group": 0,
    "instanceID": "DEFAULT_GUID",
    "traitConditions": 0,
    "traits": [
    ],
    "useTraits": false
}

window.templates.block = {
    "name": "DEFAULT_NAME",
    "id": "DEFAULT_GUID",
    "replacements": []
}

window.templates.blockReplacement = {
    "connection": 15,
    "dislikeLike": 0.5,
    "replaceWithID": "DEFAULT_GUID",
    "strangerKnown": 0.5,
    "traitCondition": 0,
    "traits": [
    ],
    "useConnection": false,
    "useDislikeLike": false,
    "useTraits": false
}

// Not vanilla! Maps to the scriptable object
window.templates.newspaper = {
    "disabled": false,
    "category": 0,
    "followupStories": [],
    "possibleImages": [],
    "context": 0
}
