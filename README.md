# Features

Features is a module that helps build _features_ out of sets of actions
apply them to objects and manage sets of features via external criteria
and feature-to-feature dependencies.


### The main entities:

**FeatureSet (Features)**

```javascript
var feature_set = new FeatureSet()


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


**Feature**
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
	}
    // ...
  })

  // action handlers (optional)
  handlers: [
    ['action.pre', function(){ /* ... */ }],
    // ...
  ] 
})
```

XXX



**Meta-features**  
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
