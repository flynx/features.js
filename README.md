# `features.js`

`features.js` organizes sets of [actions](https://github.com/flynx/actions.js) 
or _object methods_ into features, applies them, manages merging of features via 
inter-feature dependencies and external criteria.


- [`features.js`](#featuresjs)
  - [Basics](#basics)
    - [Organizational structure](#organizational-structure)
    - [Lifecycle](#lifecycle)
    - [How features are loaded](#how-features-are-loaded)
  - [The main entities:](#the-main-entities)
    - [`FeatureSet()`](#featureset)
      - [`<feature-set>.features`](#feature-setfeatures)
      - [`<feature-set>.setup(..)`](#feature-setsetup)
      - [`<feature-set>.remove(..)`](#feature-setremove)
      - [`<feature-set>.gvGraph(..)`](#feature-setgvgraph)
    - [`Feature(..)`](#feature)
    - [Meta-features](#meta-features)



## Basics

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



<!-- vim:set ts=4 sw=4 spell : -->
