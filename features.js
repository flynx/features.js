/**********************************************************************
* 
*
*
**********************************************************************/
((typeof define)[0]=='u'?function(f){module.exports=f(require)}:define)(
function(require){ var module={} // makes module AMD/node compatible...
/*********************************************************************/

var object = require('ig-object')
var actions = module.actions = require('ig-actions')



/*********************************************************************/

var args2array = function(a){ return [].slice.call(a) } 



/*********************************************************************/
//
// Feature attributes:
// 	.tag			- feature tag (string)
// 					  this is used to identify the feature, its event handlers
// 					  and DOM elements.
//
// 	.title			- feature name (string | null)
// 	.doc			- feature description (string | null)
//
// 	.priority		- feature priority
// 					  can be:
// 					  	- 'high' (99) | 'medium' (0) | 'low' (-99)
// 					  	- number
// 					  	- null (0, default)
// 					  features with higher priority will be setup first,
// 					  features with the same priority will be run in order of
// 					  occurrence.
// 	.suggested		- list of optional suggested features, these are not 
// 					  required but setup if available.
// 					  This is useful for defining meta features but without
// 					  making each sub-feature a strict dependency.
// 	.depends		- feature dependencies -- tags of features that must setup
// 					  before the feature (list | null)
// 					  NOTE: a feature can depend on an exclusive tag, this will
// 					  		remove the need to track which specific exclusive
// 					  		tagged feature is loaded...
// 	.exclusive		- feature exclusivity tags (list | null)
// 					  an exclusivity group enforces that only one feature in
// 					  it will be run, i.e. the first / highest priority.
//
// 	.actions		- action object containing feature actions (ActionSet | null)
// 					  this will be mixed into the base object on .setup()
// 					  and mixed out on .remove()
// 	.config			- feature configuration, will be merged with base 
// 					  object's .config
// 					  NOTE: the final .config is an empty object with
// 					  		.__proto__ set to the merged configuration
// 					  		data...
// 	.handlers		- feature event handlers (list | null)
// 
//
//
// .handlers format:
// 	[
// 		[ <event-spec>, <handler-function> ],
// 		...
// 	]
//
// NOTE: both <event-spec> and <handler-function> must be compatible with
// 		Action.on(..)
//
//
// Feature applicability:
// 	If feature.isApplicable(..) returns false then the feature will not be
// 	considered on setup...
//
//
// XXX this could install the handlers in two locations:
// 		- mixin if available...
// 		- base object (currently implemented)
// 		should the first be done?
var FeatureProto =
module.FeatureProto = {
	tag: null,

	isApplicable: function(actions){ return true },

	getPriority: function(){
		var res = this.priority || 0
		return res == 'high' ? 99
			: res == 'low' ? -99
			: res == 'medium' ? 0
			: res
	},

	setup: function(actions){
		var that = this

		// mixin actions...
		if(this.actions != null){
			this.tag ? 
				actions.mixin(this.actions, {source_tag: this.tag}) 
				: actions.mixin(this.actions) 
		}

		// install handlers...
		if(this.handlers != null){
			this.handlers.forEach(function(h){
				actions.on(h[0], that.tag, h[1])
			})
		}

		// merge config...
		// NOTE: this will merge the actual config in .config.__proto__
		// 		keeping the .config clean for the user to lay with...
		if(this.config != null 
				|| (this.actions != null 
					&& this.actions.config != null)){
			var config = this.config = this.config || this.actions.config

			if(actions.config == null){
				actions.config = Object.create({})
			}
			Object.keys(config).forEach(function(n){
				// NOTE: this will overwrite existing values...
				actions.config.__proto__[n] = config[n]
			})
		}

		// custom setup...
		// XXX is this the correct way???
		if(this.hasOwnProperty('setup') && this.setup !== FeatureProto.setup){
			this.setup(actions)
		}

		return this
	},
	remove: function(actions){
		if(this.actions != null){
			actions.mixout(this.actions)
		}

		if(this.handlers != null){
			actions.off('*', this.tag)
		}

		if(this.hasOwnProperty('remove') && this.setup !== FeatureProto.remove){
			this.remove(actions)
		}

		// remove feature DOM elements...
		actions.ribbons.viewer.find('.' + this.tag).remove()

		return this
	},
}


// XXX is hard-coded default feature-set a good way to go???
//
// 	Feature(obj)
// 		-> feature
//
// 	Feature(feature-set, obj)
// 		-> feature
//
// 	Feature(tag, obj)
// 		-> feature
//
// 	Feature(tag, suggested)
// 		-> feature
//
// 	Feature(tag, actions)
// 		-> feature
//
// 	Feature(feature-set, tag, actions)
// 		-> feature
//
var Feature =
module.Feature =
function Feature(feature_set, tag, obj){
	if(arguments.length == 2){
		// Feature(<tag>, <obj>)
		if(typeof(feature_set) == typeof('str')){
			obj = tag
			tag = feature_set
			feature_set = Features

		// Feature(<feature-set>, <obj>)
		} else {
			obj = tag
			tag = null
		}

	// Feature(<obj>)
	} else if(arguments.length == 1){
		obj = feature_set
		feature_set = Features
	}

	if(tag != null && obj.tag != null && obj.tag != tag){
		throw 'Error: tag and obj.tag mismatch, either use one or both must match.'
	}

	// action...
	if(obj instanceof actions.Action){
		if(tag == null){
			throw 'Error: need a tag to make a feature out of an action'
		}
		var f = {
			tag: tag,
			actions: obj,
		}
		obj = f

	// meta-feature...
	} else if(obj.constructor === Array){
		if(tag == null){
			throw 'Error: need a tag to make a meta-feature'
		}
		var f = {
			tag: tag,
			suggested: obj,
		}
		obj = f

	// feature...
	} else {
		obj.__proto__ = FeatureProto
	}

	if(feature_set){
		feature_set[obj.tag] = obj
	}

	return obj
}
Feature.prototype = FeatureProto
Feature.prototype.constructor = Feature


var FeatureSetProto = {
	__feature__: Feature,
	__actions__: actions.Actions,

	// if true, .setup(..) will report things it's doing... 
	__verbose__: null,

	// List of registered features...
	get features(){
		var that = this
		return Object.keys(this)
			.filter(function(e){ 
				return e != 'features' 
					&& that[e] instanceof Feature }) 
	},

	// Build list of features...
	//
	//	Build list of all features for an empty object...
	//	.buildFeatureList()
	//	.buildFeatureList({})
	//	.buildFeatureList({}, '*')
	//		-> data
	//
	//	Build a list of features for a specific root feature and object...
	//	.buildFeatureList(object, feature)
	//		-> data
	//
	//	Build a list of features for a specific set of root features and object...
	//	.buildFeatureList(object, [feature, ..])
	//		-> data
	//		NOTE: to disable a feature and all of it's dependants prefix
	//			it's tag with '-' in the list.
	//			e.g. including 'some-feature' will include the feature
	//			and its dependants while '-some-feature' will remove
	//			it and it's dependants.
	//
	//
	// This will build from user input a loadable list of features taking 
	// into account feature dependencies, priorities and suggestions.
	//
	// Roughly this is done in this order starting with the given features:
	// 	- include all dependencies (recursively)
	// 	- include all suggested features (recursively)
	// 	- sort features by priority
	// 	- sort features by dependency
	// 	- check for feature applicability
	// 	- remove non-applicable features and all dependants (recursively)
	// 	- remove disabled features and all dependants (recursively)
	// 	- check and resolve exclusivity conflicts (XXX needs revision)
	// 	- check for missing features and dependencies
	//
	//
	// Return format:
	// 	{
	// 		// list of input features...
	// 		input: [ .. ],
	//
	//		// features in correct load order...
	//		features: [ .. ],
	//
	//		// features disabled explicitly and their dependants...
	//		disabled: [ .. ],
	//		// unapplicable features and their dependants...
	//		unapplicable: [ .. ],
	//
	//		// features removed due to exclusivity conflict...
	//		excluded: [ .. ],
	//
	//		missing: {
	//			// features explicitly given by user but missing...
	//			USER: [ .. ],
	//			// missing <feature> dependencies...
	//			<feature>: [ .. ],
	//			...
	//		},
	//		conflicts: {
	//			XXX
	//		},
	// 	}
	//
	//
	// NOTE: obj (action set) here is used only for applicability testing...
	// NOTE: some feature applicability checks (.isApplicable(..)) may 
	// 		require a real action set, thus for correct operation one 
	// 		should be provided.
	// NOTE: all feature sorting is done maintaining relative feature order
	// 		when possible...
	// NOTE: meta-features are not included in the list as they do not 
	// 		need to be setup.
	// 		...this is because they are not Feature objects.
	//
	// XXX should meta-features be MetaFeature objects???
	// XXX not sure about handling excluded features (see inside)...
	// XXX add dependency loops to .conflicts...
	// XXX might be a good idea to check dependency loops on feature 
	// 		construction, too... (???)
	/*
	buildFeatureList: function(obj, lst){
		var that = this
		obj = obj || {}

		lst = (lst == null || lst == '*') ? this.features : lst
		lst = lst.constructor !== Array ? [lst] : lst

		var input = lst.slice()
		var disabled = [] 
		var excluded = []
		var unapplicable = []
		var missing = {}
		var conflicts = {}

		var exclusive = {}


		// reverse dependency cache... 
		var dependants = {}

		// build dependency list...
		var _buildDepList = function(n, seen){
			seen = seen || []
			return seen.indexOf(n) >= 0 ? []
				: seen.push(n) && dependants[n] ? []
					.concat.apply(
						dependants[n], 
						dependants[n]
							.map(function(n){ return _buildDepList(n, seen) }))
				: []
		}


		// missing stage 1: check if all user included features exist...
		// NOTE: we'll ignore missing disabled features too...
		lst.forEach(function(n){
			if(!that[n] && n[0] != '-'){
				var m = missing['USER'] = missing['USER'] || []
				m.push(n)
			}
		})

		// include all dependencies...
		//
		// NOTE: this should never fall into an infinite loop as we do 
		// 		not include feature already seen...
		// 		...unless there is an infinite number of features, but 
		// 		I'll try to avoid that big a feature creep.
		// XXX should we check for dependency loops here???
		// 		...this would have been simple if this was a recursion
		// 		(just check if cur is in path), but here it is not 
		// 		trivial...
		for(var i=0; i < lst.length; i++){
			var k = lst[i]

			// skip disabled or missing features....
			if(k[0] == '-' || !that[k]){
				continue
			}

			var deps = that[k].depends || []
			var refs = that[k].suggested || []
			var excl = that[k].exclusive || []

			deps.forEach(function(n){
				// expand lst with dependencies....
				lst.indexOf(n) < 0 && lst.push(n)

				// build reverse dependency index...
				var d = dependants[n] = dependants[n] || []
				d.indexOf(k) < 0 && d.push(k)
			})

			// expand lst with suggenstions....
			refs.forEach(function(n){
				lst.indexOf(n) < 0 && lst.push(n)
			})

			// build exclusive table...
			excl.forEach(function(n){
				var l = exclusive[n] = exclusive[n] || []
				l.indexOf(k) < 0 && l.push(k)
			})
		}

		// sort features by priority or position...
		lst = lst
			// remove undefined and non-features...
			.filter(function(n){ 
				// feature disabled -> record and skip...
				if(n[0] == '-'){
					disabled.push(n.slice(1))
					return false
				}
				var f = that[n]
				// feature not defined or is not a feature...
				if(f == null || !(f instanceof Feature)){
					return false
				}
				// check applicability...
				if(f.isApplicable && !f.isApplicable.call(that, obj)){
					unapplicable.push(n)
					return false
				}
				return true
			})
			// remove disabled...
			.filter(function(e){ return disabled.indexOf(e) < 0 })
			// build the sort table: [ <priority>, <index>, <elem> ]
			.map(function(e, i){ return [ that[e].getPriority(), i, e ] })
			// sort by priority then index...
			// NOTE: JS compares lists as strings so we have to compare 
			// 		the list manually...
			.sort(function(a, b){ return a[0] - b[0] || a[1] - b[1] })
			// cleanup -- drop the sort table...
			.map(function(e){ return e[2] })

		// remove dependants on not applicable and on disabled...
		var _unapplicable = unapplicable.slice()
		var _disabled = disabled.slice()
		// build the full lists of features to remove...
		_unapplicable
			.forEach(function(n){ _unapplicable = _unapplicable.concat(_buildDepList(n)) })
		_disabled
			.forEach(function(n){ _disabled = _disabled.concat(_buildDepList(n)) })
		// clear...
		// NOTE: in case of intersection disabled has priority...
		lst = lst
			.filter(function(n){
				return _disabled.indexOf(n) >= 0 ?
						disabled.push(n) && false
					: _unapplicable.indexOf(n) >= 0 ?
						unapplicable.push(n) && false
					: true })

		// missing stage 2: dependencies...
		lst.forEach(function(k){
			(that[k].depends || []).forEach(function(d){
				// NOTE: we do not need to check disabled or unapplicable
				// 		here as if the feature depended on dropped feature
				// 		it would have been already dropped too...
				// NOTE: we skip exclusive tags as they will get replaced 
				// 		with actual feature tags later...
				// 		if a tag is exclusive then at least one feature 
				// 		with it is present...
				if(!that[d] && !exclusive[d] && d[0] != '-'){
					var m = missing[k] = missing[k] || []
					m.push(d)
				}
			})
		})

		// check exclusive -> excluded...
		//
		// NOTE: this is the right spot for this, just after priority 
		// 		sorting and clearing but before dependency sorting.
		//
		// XXX do we need to clear dependencies pulled by excluded features???
		// 		ways to go:
		// 			- drop excluded and continue (current state)
		// 			- disable excluded, add to original input and rebuild
		// 			- err and let the user decide
		var _exclusive = []
		lst = lst.filter(function(n){
			var e = that[n]

			// keep non-exclusive stuff...
			if(!e || e.exclusive == null){
				return true
			}

			// count the number of exclusive features already present...
			var res = e.exclusive
				.filter(function(n){
					if(_exclusive.indexOf(n) < 0){
						_exclusive.push(n)
						return false
					}
					return true
				})
				.length == 0

			!res 
				&& excluded.push(n)
				// warn the user...
				// XXX not sure if this is the right place for this...
				&& console.warn(
					'Excluding unaplicable:', n, '(reccomended to exclude manually)')

			return res
		})

		// sort by dependency...
		var l = lst.length
		// get maximum possible length...
		// ...the worst case length appears to be (for full reversal):
		// 		S(2*(n-1) + 1)
		// 			S = n => n > 0 ? 2*(n-1)+1 + S(n-1) : 0
		// 			S = n => n > 0 ? 2*n-1 + S(n-1) : 0
		//
		// 		2 * S(n) - n
		// 			S = n => n > 0 ? n + S(n-1) : 0
		// 			f = n => 2 * S(n) - n
		//
		//		N^2 + C
		//			S = n => n * n
		//
		// NOTE: this is the brute force way to check if we have a 
		// 		dependency loop, need something faster...
		//
		// XXX is O(n^2) good enough worst case here?
		// 		...at this point I think it is acceptable as we'll not 
		// 		expect dependency graphs too saturated, and the average 
		// 		complexity is far better...
		var max = l * l

		var moved = []
		var chain = []
		var chains = []

		for(var i=0; i < lst.length; i++){
			var k = lst[i]
			var depends = (that[k].depends || []).slice()

			// replace dependencies that are exclusive tags...
			Object.keys(exclusive).forEach(function(e){
				var i = depends.indexOf(e)
				i >= 0 
					&& exclusive[e].forEach(function(f){
						if(lst.indexOf(f) >= 0){
							//console.log('EXCL->DEP', e, f)
							depends[i] = f
						}
					})
			})

			// list of dependencies to move...
			var move = []

			lst
				.slice(0, i)
				.forEach(function(n, j){
					// if n is a dependency of k, prepare to move...
					if(depends.indexOf(n) >= 0){
						delete lst[j] 
						move.push(n)
					}
				})

			// move the dependencies after k...
			// NOTE: this will keep the order within the dependencies...
			if(move.length > 0){
				lst.splice.apply(lst, [i+1, 0].concat(move))

				// unseen feature -> new chain...
				if(moved.indexOf(k) < 0){
					chain = []
				}

				moved.push(k)

				// chain completed -> check and store...
				if(chain.indexOf(k) >= 0){
					var c = JSON.stringify(chain)
					// repeating chain -> loop or order conflict detected...
					if(chains.indexOf(c) >= 0){
						// format the graph... 
						// XXX this catches strange things and not only loops...
						// 		...at this point I can't repeat this error, see
						// 		ImageGrid.Viewer in nwjs load console output...
						var graph = []
						chain.forEach(function(k){ 
							graph = graph
								.concat((that[k].depends || [])
									.filter(function(e){ 
										return chain.indexOf(e) >= 0 })
									.map(function(e){ 
										return `${k}  \t-> ${e}` })) })
						console.error('Feature cyclic dependency or order conflict:\n\t' 
							+ graph.join('\n\t'))

						// XXX should we give up completely (break) here 
						// 		or move on and find new loops???
						break
					}
					chains.push(c)

				// add item to chain...
				} else {
					chain.push(k)
				}
			}

			// check for cyclic dependencies...
			// XXX loop signs:
			// 		- the tail length stops changing -- we stop progressing to list end
			// 		- the loop is packed
			// 			- each element includes a set of dependencies
			// 			- this set is of the same length when at a specific element
			// 		- we only shift the same set of N elements over N iterations
			// 		- ...
			if(lst.length >= max){
				// XXX get the actual cycle...
				console.error('Feature cyclic dependency:', chain)
				break
			}
		}

		// cleanup after sort...
		lst = lst
			// remove undefined and non-features...
			.filter(function(e){ 
				return that[e] != null && that[e] instanceof Feature })
			.reverse()


		return {
			input: input,

			features: lst,

			disabled: disabled,
			unapplicable: unapplicable,
			excluded: excluded,

			missing: missing,
			conflicts: conflicts,
		}
	},
	setup: function(obj, lst){
		// if no explicit object is given, just the list...
		if(lst == null){
			lst = obj
			obj = null
		}

		obj = obj || (this.__actions__ || actions.Actions)()

		lst = lst.constructor !== Array ? [lst] : lst
		var features = this.buildFeatureList(obj, lst)
		lst = features.features

		// check for conflicts...
		if(Object.keys(features.conflicts).length != 0
				|| Object.keys(features.missing).length != 0){
			var m = features.missing
			var c = features.conflicts

			// build a report...
			var report = []

			// missing deps...
			Object.keys(m).forEach(function(k){
				report.push(k + ': requires following missing features:\n'
					+'          ' + m[k].join(', '))
			})
			report.push('\n')

			// conflicts...
			Object.keys(c).forEach(function(k){
				report.push(k + ': must setup after:\n          ' + c[k].join(', '))
			})

			// break...
			throw 'Feature dependency error:\n    ' + report.join('\n    ') 
		}

		// report excluded features...
		if(this.__verbose__ && features.excluded.length > 0){
			console.warn('Excluded features due to exclusivity conflict:', 
					features.excluded.join(', '))
		}

		// report unapplicable features...
		if(this.__verbose__ && features.unapplicable.length > 0){
			console.log('Features not applicable in current context:', 
					features.unapplicable.join(', '))
		}

		// do the setup...
		var that = this
		var setup = FeatureProto.setup
		lst.forEach(function(n){
			// setup...
			if(that[n] != null){
				this.__verbose__ && console.log('Setting up feature:', n)
				setup.call(that[n], obj)
			}
		})

		// XXX should we extend this if it already was in the object???
		obj.features = features

		return obj
	},
	//*/


	// Build list of features in load order...
	//
	// 	.buildFeatureList()
	// 	.buildFeatureList('*')
	// 		-> data
	//
	// 	.buildFeatureList(feature-tag)
	// 		-> data
	//
	// 	.buildFeatureList([feature-tag, .. ])
	// 		-> data
	//
	// 	.buildFeatureList(.., filter)
	// 		-> data
	//
	//
	// return format:
	// 	{
	//		// input feature feature tags...
	//		input: [ .. ],
	//
	//		// output list of feature tags...
	//		features: [ .. ],
	//
	//		// disabled features...
	//		disabled: [ .. ],
	//		// exclusive features that got excluded... 
	//		excluded: [ .. ],
	//
	//		// Errors...
	//		error: null | {
	//			// fatal/recoverable error indicator...
	//			fatal: bool,
	//
	//			// missing dependencies...
	//			// NOTE: this includes tags only included by .depends and 
	//			//		ignores tags from .suggested...
	//			missing: [ .. ],
	//
	//			// XXX
	//			conflicts: conflicts,
	//
	//			// detected dependency loops (if .length > 0 sets fatal)...
	//			loops: [ .. ],
	//
	//			// sorting loop overflow error (if true sets fatal)...
	//			sort_loop_overflow: bool,
	//		},
	//
	//		// Introspection...
	//		// index of features and their list of dependencies...
	//		depends: {
	//			feature-tag: [ feature-tag, .. ],
	//			..
	//		},
	//		// index of features and list of features depending on them...
	//		// XXX should this include suggestions or should we do them 
	//		//		in a separate list...
	//		depended: { 
	//			feature-tag: [ feature-tag, .. ],
	//			..
	//		},
	// 	}
	//
	//
	// Algorithm:
	// 	- expand features:
	// 		- handle dependencies (detect loops)
	// 		- handle suggestions
	// 		- handle explicitly disabled features (detect loops)
	// 		- handle exclusive feature groups/aliases (handle conflicts)
	// 	- sort list of features:
	// 		- by priority
	// 		- by dependency (detect loops/errors)
	//
	//
	// XXX differences to .buildFeatureList(..):
	// 		- order is slightly different -- within expectations...
	// 		- this includes meta-features...
	// 			this seems to be more logical and more flexible...
	buildFeatureList: function(lst, filter){
		var all = this.features
		lst = (lst == null || lst == '*') ? all : lst
		lst = lst.constructor !== Array ? [lst] : lst

		var that = this

		// Expand feature references (recursive)...
		//
		// NOTE: closures are not used here as we need to pass different
		// 		stuff into data in different situations...
		var expand = function(target, lst, store, data, _seen){
			data = data || {}
			_seen = _seen || []

			// clear disabled...
			// NOTE: we do as a separate stage to avoid loading a 
			// 		feature before it is disabled in the same list...
			lst = data.disabled ?
				lst
					.filter(function(n){
						// feature disabled -> record and skip...
						if(n[0] == '-'){
							n = n.slice(1)
							if(_seen.indexOf(n) >= 0){
								// NOTE: a disable loop is when a feature tries to disable
								// 		a feature up in the same chain...
								// XXX should this break or accumulate???
								console.warn(`Disable loop detected at "${n}" in chain: ${_seen}`)
								var loop = _seen.slice(_seen.indexOf(n)).concat([n])
								data.disable_loops = (data.disable_loops || []).push(loop)
								return false
							}
							// XXX STUB -- need to resolve actual loops and 
							// 		make the disable global...
							if(n in store){
								console.warn('Disabling a feature after it is loaded:', n, _seen)
							}
							data.disabled.push(n)
							return false
						}
						// skip already disabled features...
						if(data.disabled.indexOf(n) >= 0){
							return false
						}
						return true
					})
				: lst

			// traverse the tree...
			lst
				// normalize the list -- remove non-features and resolve aliases...
				.map(function(n){ 
					var f = that[n]
					// exclusive tags...
					if(f == null && data.exclusive && n in data.exclusive){
						store[n] = null
						return false
					}
					// feature not defined or is not a feature...
					if(f == null){
						data.missing 
							&& data.missing.indexOf(n) < 0
							&& data.missing.push(n)
						return false
					}
					return n
				})
				.filter(function(e){ return e })

				// traverse down...
				.forEach(function(f){
					// dependency loop detection...
					if(_seen.indexOf(f) >= 0){
						var loop = _seen.slice(_seen.indexOf(f)).concat([f])
						data.loops 
							&& data.loops.push(loop)
						return
					}

					// skip already done features...
					if(f in store){
						return
					}

					//var feature = store[f] = that[f]
					var feature = that[f]
					if(feature){
						var _lst = []

						// merge lists...
						;(target instanceof Array ? target : [target])
							.forEach(function(t){
								_lst = _lst.concat(feature[t] || [])
							})
						store[f] = _lst 

						// traverse down...
						expand(target, _lst, store, data, _seen.concat([f]))
					}
				})

			return store
		}

		// Expand feature dependencies and suggestions recursively...
		//
		// NOTE: this relies on the following values being in the closure:
		// 		loops			- list of loop chains found
		// 		disable_loops	- disable loops
		// 							when a feature containing a disable 
		// 							directive gets disabled as a result
		// 		disabled		- list of disabled features
		// 		missing			- list of missing features
		// 		exclusive		- exclusive feature index
		// NOTE: the above containers will get updated as a side-effect.
		// NOTE: all of the above values are defined near the location 
		// 		they are first used/initiated...
		// NOTE: closures are used here purely for simplicity and conciseness
		// 		as threading data would not add any flexibility but make 
		// 		the code more complex...
		var expandFeatures = function(lst, features){
			features = features || {}

			// feature tree...
			var expand_data = {
				loops: loops, 
				disabled: disabled, 
				disable_loops: disable_loops, 
				missing: missing,
				exclusive: exclusive,
			}

			features = expand('depends', lst, features, expand_data)

			// suggestion list...
			//	...this will be used to check if we need to break on missing 
			//	features, e.g. if a feature is suggested we can silently skip 
			//	it otherwise err...
			//
			// NOTE: this stage does not track suggested feature dependencies...
			// NOTE: we do not need loop detection active here...
			var s = Object.keys(
					expand('suggested', Object.keys(features), {}, 
						{
							disabled: disabled, 
						}))
				.filter(function(f){ return !(f in features) })
			// get suggestion dependencies...
			// NOTE: we do not care bout missing here...
			s = expand('depends', s, {}, 
				{ 
					loops: loops, 
					disabled: disabled, 
					disable_loops: disable_loops, 
					exclusive: exclusive,
				})
			Object.keys(s)
				.forEach(function(f){ 
					// keep only suggested features -- diff with features...
					if(f in features){
						delete s[f]

					// mix suggested into features...
					} else {
						features[f] = s[f]
					}
				})

			return features
		}


		//--------------------- Globals: filtering / exclusive tags ---

		var loops = []
		var disable_loops = []
		var disabled = []
		var missing = []

		// user filter...
		// NOTE: we build this out of the full feature list...
		disabled = disabled
			.concat(filter ?
				all.filter(function(n){ return !filter.call(that, n) })
				: [])

		// build exclusive groups...
		var exclusive = {}
		var rev_exclusive = {}
		all
			.filter(function(f){ return !!that[f].exclusive })
			.forEach(function(k){
				(that[k].exclusive || [])
					.forEach(function(e){
						exclusive[e] = (exclusive[e] || []).concat([k]) 
						rev_exclusive[k] = (rev_exclusive[k] || []).concat([e]) }) })


		//-------------------------------- Stage 1: expand features ---
		var features = expandFeatures(lst)


		//-------------------------------- Exclusive groups/aliases ---
		// Handle exclusive feature groups and aliases...
		//
		var conflicts = {}
		var done = []
		Object.keys(features)
			.forEach(function(f){
				// alias...
				while(f in exclusive && done.indexOf(f) < 0){
					var candidates = (exclusive[f] || [])
						.filter(function(c){ return c in features })

					// resolve alias to non-included feature...
					if(candidates.length == 0){
						var target = exclusive[f][0]

						// expand target to features...
						expandFeatures([target], features)

					// link alias to existing feature...
					} else {
						var target = candidates[0]
					}

					// remove the alias...
					// NOTE: exclusive tag can match a feature tag, thus
					// 		we do not want to delete such tags...
					if(!(f in that)){
						delete features[f]
					}
					// replace dependencies...
					Object.keys(features)
						.forEach(function(e){
							var i = features[e] ? features[e].indexOf(f) : -1
							i >= 0
								&& features[e].splice(i, 1, target)
						})
					f = target
					done.push(f)
				}
				
				// exclusive feature...
				if(f in rev_exclusive){
					// XXX handle multiple groups... (???)
					var group = rev_exclusive[f]
					var candidates = (exclusive[group] || [])
						.filter(function(c){ return c in features })

					if(!(group in conflicts) && candidates.length > 1){
						conflicts[group] = candidates
					}
				}
			})
		// resolve any exclusivity conflicts found...
		var excluded = []
		Object.keys(conflicts)
			.forEach(function(group){
				// XXX is this how we decide which feature to keep???
				excluded = excluded.concat(conflicts[group].slice(1))})
		disabled = disabled.concat(excluded)


		//--------------------------------------- Disabled features ---
		// Handle disabled features and cleanup...

		// reverse dependency index...
		// 	...this is used to clear out orphaned features later and for
		// 	introspection...
		var rev_features = {}
		Object.keys(features)
			.forEach(function(f){
				(features[f] || [])
					.forEach(function(d){ 
						rev_features[d] = (rev_features[d] || []).concat([f]) }) })

		// clear dependency trees containing disabled features...
		do {
			var expanded_disabled = false
			disabled
				.forEach(function(d){ 
					// disable all features that depend on a disabled feature...
					Object.keys(features)
						.forEach(function(f){ 
							if(features[f]
									&& features[f].indexOf(d) >= 0
									&& disabled.indexOf(f) < 0){
								expanded_disabled = true
								disabled.push(f)
							}
						})
					// delete the feature itself...
					delete features[d] 
				})
		} while(expanded_disabled)

		// remove orphaned features...
		// ...an orphan is a feature included by a disabled feature...
		// NOTE: this should take care of missing features too...
		Object.keys(rev_features)
			.filter(function(f){
				return rev_features[f]
					// keep non-disabled and existing sources only...
					.filter(function(e){ 
						return !(e in features) || disabled.indexOf(e) < 0 })
					// keep features that have no sources left, i.e. orphans...
					.length == 0 })
			.forEach(function(f){
				disabled.push(f)
				delete features[f]
			})


		//---------------------------------- Stage 2: sort features ---

		// Prepare for sort: expand dependency list in features... 
		//
		// NOTE: this will expand lst in-place...
		// NOTE: we are not checking for loops here -- mainly because
		// 		the input is expected to be loop-free...
		var expanddeps = function(lst, cur, seen){
			seen = seen || []
			if(features[cur] == null){
				return
			}
			// expand the dep list recursively...
			// NOTE: this will expand features[cur] in-place while 
			// 		iterating over it...
			for(var i=0; i < features[cur].length; i++){
				var f = features[cur][i]
				if(seen.indexOf(f) < 0){
					seen.push(f)

					expanddeps(features[cur], f, seen)

					features[cur].forEach(function(e){
						lst.indexOf(e) < 0
							&& lst.push(e)
					})
				}
			}
		}
		// do the actual expansion...
		var list = Object.keys(features)
		list.forEach(function(f){ expanddeps(list, f) })

		// sort by priority...
		//
		// NOTE: this will attempt to only move features with explicitly 
		// 		defined priorities and keep the rest in the same order 
		// 		when possible...
		list = list
			// format: 
			// 	[ <feature>, <index>, <priority> ]
			.map(function(e, i){ 
				return [e, i, (that[e] && that[e].getPriority) ? that[e].getPriority() : 0 ] })
			.sort(function(a, b){ 
				return a[2] - b[2] || a[1] - b[1] })
			// cleanup...
			.map(function(e){ return e[0] })
			// sort by the order features should be loaded...
			.reverse()

		// sort by dependency...
		//
		// NOTE: this requires the list to be ordered from high to low 
		// 		priority, i.e. the same order they should be loaded in...
		// NOTE: dependency loops will throw this into and "infinite" loop...
		var loop_limit = list.length + 1
		do {
			var moves = 0
			if(list.length == 0){
				break
			}
			list
				.slice()
				.forEach(function(e){
					var deps = features[e]
					if(!deps){
						return
					}
					var from = list.indexOf(e)
					var to = list
						.map(function(f, i){ return [f, i] })
						.slice(from+1)
						// keep only dependencies...
						.filter(function(f){ return deps.indexOf(f[0]) >= 0 })
						.pop()
					if(to){
						// place after last dependency...
						list.splice(to[1]+1, 0, e)
						list.splice(from, 1)
						moves++
					}
				})
			loop_limit--
		} while(moves > 0 && loop_limit > 0)


		//-------------------------------------------------------------
		
		return {
			input: lst,

			features: list,

			disabled: disabled,
			excluded: excluded,

			// errors and conflicts...
			error: (loops.length > 0 
					|| Object.keys(conflicts).length > 0 
					|| loop_limit <= 0 
					|| missing.length > 0) ?
				{
					missing: missing,
					conflicts: conflicts,

					// fatal stuff...
					fatal: loops.length > 0 || loop_limit <= 0,
					loops: loops,
					sort_loop_overflow: loop_limit <= 0,
				}
				: null,

			// introspection...
			depends: features,
			depended: rev_features,
			//suggests: suggested,
			//exclusive: exclusive,
		}
	},

	// Setup features...
	//
	//	Setup features on existing actions object...
	//	.setup(actions, [feature-tag, ...])
	//		-> actions
	//
	//	Setup features on a new actions object...
	//	.setup(feature-tag)
	//	.setup([feature-tag, ...])
	//		-> actions
	//
	//
	// This will add .unapplicable to the output of .buildFeatureList(..) 
	// and to .features of the resulting object...
	//
	// NOTE: this will store the build result in .features of the output 
	// 		actions object.
	setup: function(obj, lst){
		// no explicit object is given...
		if(lst == null){
			lst = obj
			obj = null
		}
		obj = obj || (this.__actions__ || actions.Actions)()
		lst = lst instanceof Array ? lst : [lst]

		var unapplicable = []
		var features = this.buildFeatureList(lst, 
			function(n){
				var f = this[n]
				// check applicability if possible...
				if(f && f.isApplicable && !f.isApplicable.call(this, obj)){
					unapplicable.push(n)
					return false
				}
				return true
			}) 
		features.unapplicable = unapplicable 
		// cleanup disabled...
		features.disabled = features.disabled
			.filter(function(n){ return unapplicable.indexOf(n) < 0 })

		// if we have critical errors and set verbose...
		var fatal = features.error 
			&& (features.error.loops.length > 0 || features.error.sort_loop_overflow)
		var verbose = this.__verbose__ || fatal 

		// report stuff...
		if(verbose){
			// report dependency loops...
			features.error.loops.length > 0
				&& loops
					.forEach(function(loop){
						console.warn('feature loop detected:\n\t' + loop.join('\n\t\t-> ')) })
			// report conflicts...
			Object.keys(features.error.conflicts)
				.forEach(function(group){
					console.error('Exclusive "'+ group +'" conflict at:', conflicts[group]) })
			// report loop limit...
			features.error.sort_loop_overflow
				&& console.error('Hit loop limit while sorting dependencies!')
		}

		obj.features = features

		// fatal error -- can't load...
		// XXX should we throw an error here???
		if(fatal){
			return
		}

		// do the setup...
		var that = this
		var setup = FeatureProto.setup
		features.features.forEach(function(n){
			// setup...
			if(that[n] != null){
				this.__verbose__ && console.log('Setting up feature:', n)
				setup.call(that[n], obj)
			}
		})

		return obj
	},
	remove: function(obj, lst){
		lst = lst.constructor !== Array ? [lst] : lst
		var that = this
		lst.forEach(function(n){
			if(that[n] != null){
				console.log('Removing feature:', n)
				that[n].remove(obj)
			}
		})
	},

	// shorthand for: Feature(<feature-set>, ...)
	Feature: function(){
		return this.__feature__.apply(null, [this].concat(args2array(arguments))) },
}


var FeatureSet =
module.FeatureSet = object.makeConstructor('FeatureSet', FeatureSetProto)


//---------------------------------------------------------------------

var Features =
module.Features = new FeatureSet()




/**********************************************************************
* vim:set ts=4 sw=4 :                               */ return module })
