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
    - [`FeatureSet(..)`](#featureset)
    - [`Feature(..)`](#feature)
    - [Meta-features](#meta-features)



## Basics

```javascript
var features = require('ig-features')
```

### Organizational structure

<!-- XXX  -->


### Lifecycle

<!-- XXX -->


### How features are loaded

<!-- XXX algorithm(s) -->


## The main entities:

### `FeatureSet(..)`

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


### `Feature(..)`

```javascript
feature_set.Feature({
    tag: 'minimal_feature_example',
})

feature_set.Feature({
    // documentation (optional)...
    title: 'Example Feature',
    doc: 'A feature to demo the base API...',

    // feature unique identifier (required)...
    tag: 'feature_example',

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
        ['action.pre', function(){ /* ... */ }],
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
