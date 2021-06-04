# `features.js`

`features.js` organizes sets of [actions] or _object methods_ into features, 
applies them, manages merging of features via inter-feature dependencies and 
external criteria.


## Basics

If [actions] are a means to organize how methods are extended and called in the 
prototype chain, `features.js` defined how that prototype chain is built.

A _feature_ defines define a mixin / action-set and metadata:
- documentation
- dependencies, both hard and soft on other features
- load priority
- applicability tests

This metadata helps automatically build/rebuild a list of applicable features, 
sort it and mix their actions, configuration into an object.

In contrast to the traditional _manual_ inheritance/prototyping, here the _MRO_ 
(method resolution order) can self-adapt to the specific runtime requirements 
depending on feature metadata without the need to manually code prototype 
chains for each possible scenario.

This makes it trivial to split the desired functionality into _features_ 
vertically, a-la MVC. As well as horizontally splitting the core functionality 
and extensions, plugins, etc. into separate features.

For example splitting an app into:
```
+-------------------------------------------------------------------------------+
|  +---------------+   +------------+    +-------------+    +----------------+  |
|  | Standalone UI |   | Web App UI |--->| Web Site UI |    | Commandline UI |  |
|  +---------------+   +------------+    +-------------+    +----------------+  |
+-------+-----------------------------------------------------------------------+
        |
        v
   +---------------+
   | Data Handling |
   +---------------+
```
Each _feature_ extending the same API but implementing only it's specific 
functionality, and on setup only the relevant features/functionality is loaded.


## Contents
- [`features.js`](#featuresjs)
  - [Basics](#basics)
  - [Contents](#contents)
  - [Installing](#installing)
    - [Organizational structure](#organizational-structure)
    - [Lifecycle](#lifecycle)
    - [How features are loaded](#how-features-are-loaded)
  - [The main entities:](#the-main-entities)
    - [`FeatureSet()`](#featureset)
      - [`<feature-set>.Feature(..)`](#feature-setfeature)
      - [`<feature-set>.<feature-tag>` / `<feature-set>[<feature-tag>]`](#feature-setfeature-tag--feature-setfeature-tag)
      - [`<feature-set>.features`](#feature-setfeatures)
      - [`<feature-set>.setup(..)`](#feature-setsetup)
      - [`<feature-set>.remove(..)`](#feature-setremove)
      - [`<feature-set>.gvGraph(..)`](#feature-setgvgraph)
    - [`Feature(..)`](#feature)
    - [Meta-features](#meta-features)
  - [Extending](#extending)
  - [License](#license)



## Installing

```javascript
var features = require('ig-features')
```

### Organizational structure

- `FeatureSet`  
    Contains features, defines the main feature manipulation API, acts as the target 
    object constructor/factory.
- `Feature`  
    Creates a feature in the feature-set, defines the feature metadata, references 
    the feature mixin / action set and configuration.
- `ActionSet` / mixin  
    Contains the actions/methods of the feature mixin.

<!-- XXX  -->

```javascript
// feature-set...
var App = new features.FeatureSet()

// features...
App.Feature('A', {
    // ...
})
App.Feature('B', {
    // ...
})

// meta-features...
App.Feature('all', [
    'B',
    'C',
])

// init and start the app...
var app = App.start(['all'])
```


### Lifecycle

<!-- XXX -->


### How features are loaded

<!-- XXX algorithm(s) -->


## The main entities:

### `FeatureSet()`

```bnf
FeatureSet()
    -> <feature-set>
```

```javascript
var feature_set = new features.FeatureSet()


// define features...
// ...


// setup features...
feature_set
    .setup([
        'feature-tag',
        //...
    ])
```

XXX

#### `<feature-set>.Feature(..)`

Feature constructor.

For more info see: [`Feature(..)`](#feature)


#### `<feature-set>.<feature-tag>` / `<feature-set>[<feature-tag>]`

<!-- XXX -->


#### `<feature-set>.features`

<!-- XXX -->


#### `<feature-set>.setup(..)`

<!-- XXX -->


#### `<feature-set>.remove(..)`

<!-- XXX -->


#### `<feature-set>.gvGraph(..)`

Get a [Graphvis](https://graphviz.org/) graph spec for the feature dependency graph.

<!-- XXX -->



### `Feature(..)`

Standalone feature
```bnf
Feature({ tag: <tag>, .. })
Feature(<tag>, { .. })
Feature(<tag>, [<suggested-tag>, .. ])
Feature(<tag>, <actions>)
	-> <feature>
```

Feature-set features
```bnf
<feature-set>.Feature({ tag: <tag>, .. })
<feature-set>.Feature(<tag>, { .. })
<feature-set>.Feature(<tag>, [<suggested-tag>, .. ])
<feature-set>.Feature(<tag>, <actions>)
	-> <feature>
    
Feature(<feature-set>, { tag: <tag>, .. })
Feature(<feature-set>, <tag>, <actions>)
	-> <feature>
```

Examples:
```javascript
feature_set.Feature('minimal_feature_example', {})
```

```javascript
feature_set.Feature({
    // feature unique identifier (required)...
    tag: 'feature_example',

    // documentation (optional)...
    title: 'Example Feature',
    doc: 'A feature to demo the base API...',

    // applicability test (optional)
    isApplicable: function(){ /* ... */ },

    // feature load priority (optional)
    priority: 'medium',

    // list of feature tags to load if available (optional)
    suggested: [],

    // list of feature tags required to load before this feature (optional)
    depends: [],

    // Exclusive tag (optional)
    // NOTE: a feature can be a member of more than one exclusive group,
    //	to list more than one use an Array...
    exclusive: 'Example',

    // feature configuration (optional)
    // NOTE: if not present here this will be taken from .actions.config
    // NOTE: this takes priority over .actions.config, it is not recommended
    //	to define both.
    config: {
        option: 'value',
        // ...
    },

    // actions (optional)
    actions: Actions({
        // alternative configuration location...
        config: {
            // ...
        },
        // ...
    }),

    // action handlers (optional)
    handlers: [
        ['action.pre', 
            function(){ /* ... */ }],
        // ...
    ],
})
```

XXX



### Meta-features

```javascript
// meta-feature...
feature_set.Feature('meta-feature-tag', [
    'suggested-feature-tag',
    'other-suggested-feature-tag',
    // ...
])
```

XXX


## Extending

<!-- XXX custom mixins (non-action) -->






## License

[BSD 3-Clause License](./LICENSE)

Copyright (c) 2018+, Alex A. Naanou,
All rights reserved.


<!-- LINKS -->

[actions]: https://github.com/flynx/actions.js

<!-- vim:set ts=4 sw=4 spell : -->
