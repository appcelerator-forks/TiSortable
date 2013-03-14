// TiSortable v 1.0.0
// Copyright (c) 2013 Adam Paxton - Polanco Media, LLC
// http://github.com/adampax/TiSortable
// Licensed under the MIT License. See: /License.txt
function SortableView(args) {
	
	args.disableBounce = true;
	
	var self = Ti.UI.createScrollView(extend({
		height: Ti.UI.SIZE,
		width: Ti.UI.SIZE,
	}, args || {}));
	
	var colHeader = Ti.UI.createView({
		top:0,
		left: 0,
		height:Ti.UI.SIZE,
		width: (args.cellWidth + args.columnPadding) * args.columns
	});
	self.add(colHeader);	
	
	var platformHeight = Ti.Platform.displayCaps.platformHeight;
	
	//scrollview vars
	var scrollTop = 0,
		scrollLeft = 0;
	var scrollRect = {};
	var scrollBottom = platformHeight;  //set by default
	var scrollWait = false;	
	
	function getBottom(){
		return scrollTop + scrollBottom;
	}	
	
	self.addEventListener('scroll', function(e){
		scrollTop = e.y;
		scrollLeft = e.x;
	});
	

	var postLayoutCallback  = function(e) {
	    //update with new height
	    scrollBottom = self.rect.height;
	    scrollRect = {
	    	height: self.rect.height,
	    	width: self.rect.width,
	    	x: self.rect.x,
	    	y: self.rect.y
	    };
	}
	self.addEventListener('postlayout', postLayoutCallback);

	//mix in properties with the defaults
	args = extend({
		cellWidth : 95,
		cellHeight : 95,
		columnPadding : 10,
		rowPadding : 10,
		columns : 3,
		data : [],
		borderPadding: false,
		fixRows: false
	}, args || {});
	
	var cells = [],   //holds all the cell views
		posArray = []; //hold all the cell positions that will be associated with the cell view


	var Draggable = require('ti.draggable');
	
	populate(args);
	
	//API
	self.setData = function(data){
		args.data = data || [];
		populate(args);
	}	

	self.setColumnData = function(data){
		data = data || [];
		setColHeader(data);
	}	
	
	//FUNCTIONS
	
	function populate(obj){
		//clear out the parent view
	  	clearParentView(self, 1);
		
		//reset the cells and position array
		cells = [];
		posArray = [];
		
		var row = 0,
			rowCheck = '';
			
		//TODO find a way to dynamically drop down cells under column header
		var topPadding = 20;
	
		for (var i = 0; i < obj.data.length; i++) {
			
			var column = i % obj.columns,
				top = row * (obj.cellHeight + obj.rowPadding) + (args.borderPadding ? obj.rowPadding : 0) + topPadding,
				left = column * (obj.cellWidth + obj.columnPadding) + (args.borderPadding ? obj.columnPadding : 0);

			var cell = Draggable.createView({
				position: i,
				index: i,
				top : top,
				left : left,
				height : obj.cellHeight,
				width : obj.cellWidth,
				bubbleParent: false,
				zIndex: 1,
				minTop: obj.fixRows ? (row * top) + (obj.rowPadding * -1) + topPadding : '',
				maxTop: obj.fixRows ? (row * top) + (obj.rowPadding * 2) + topPadding : '',
				minLeft: obj.fixColumns ? obj.columnPadding * -1 : obj.columnPadding * -1
			});
			//check for empty cells and disable touch for them
			if(obj.data[i]){
				cell.add(obj.data[i]);
			} else {
				cell.isEmpty = true;
				cell.touchEnabled = false;
			}			
			
			cells.push(cell);

			posArray.push({top:top,left:left, cellIndex: i});

			self.add(cells[i]);
	
			if (column + 1 === obj.columns) {
				row++;
			}
	
			//attach the event listener to each view
			(function(v) {
				
				
				//tracking move to see if we need to reposition the scrollview
				v.addEventListener('move', function(e){
					
					//quick calc to see if we are even needing to scroll
					//TODO see if event listener can be added only when scrolling will be needed
					//var scrollHeight = scrollRect.x + scrollRect.height;
					var contentHeight = row * (obj.cellHeight+obj.rowPadding);

					//var scrollWidth = scrollRect.y + scrollRect.width;
					var contentWidth = obj.columns * (obj.cellHeight+obj.rowPadding);
					if(scrollRect.height >= contentHeight && scrollRect.width >= contentWidth) { 
						//if no scroll needed, short circuit this
						return;
					}
					
					
					var vBottom = e.top + obj.cellHeight + obj.rowPadding;
					var vTop = e.top;
					
					//when going down
					if((vBottom > getBottom() - 50) && !scrollWait && (scrollRect.height < contentHeight)){
						

						
						scrollWait = true;
						
						var newScrollTo = scrollTop+obj.cellHeight+ obj.rowPadding;
						var newViewTop = v.top + obj.cellHeight+ obj.rowPadding;
						
						var scrollEnd = scrollBottom - scrollTop - (obj.cellHeight + obj.rowPadding);
						
						if(newScrollTo >= scrollEnd){
							newScrollTo = scrollEnd;// + obj.cellHeight + obj.rowPadding;
							newViewTop = scrollEnd - (obj.cellHeight + obj.rowPadding);
						} else {
						//move the cell as well
						v.top = newViewTop;							
						}
						
						self.scrollTo(0, newScrollTo);
						
						setTimeout(function(){
							scrollWait = false;
						}, 1000);
						
					//when going up
					} else if((vTop > 50) && (vTop < scrollTop + 50) && !scrollWait){
						if(scrollRect.width >= contentWidth) { 
							//if no scroll needed, short circuit this
							return;
						}						
						
						scrollWait = true;
						
						var newScrollTo = scrollTop-obj.cellHeight - obj.rowPadding;
						newScrollTo = newScrollTo > 0 ? newScrollTo : 0;
						self.scrollTo(0, newScrollTo);
						
						//move the cell as well
						v.top = v.top - obj.cellHeight - obj.rowPadding;
						
						setTimeout(function(){
							scrollWait = false;
						}, 1000);
						
					}			
					
					
					//when going right
					else if(e.left > (scrollLeft + scrollRect.width - 50) && !scrollWait && (scrollRect.width < contentWidth)){
						
						scrollWait = true;
						
						var newScrollTo = scrollLeft+obj.cellWidth+ obj.rowPadding;
						var newViewLeft = v.top + obj.cellWidth+ obj.rowPadding;
						
						var scrollEnd = scrollRect.width - (obj.cellHeight + obj.rowPadding);
						
						if(newScrollTo >= scrollEnd){
							newScrollTo = scrollEnd;// + obj.cellHeight + obj.rowPadding;
							newViewLeft = scrollEnd - (obj.cellWidth + obj.rowPadding);
						} else {
						//move the cell as well
						v.left = v.left + obj.cellWidth + obj.rowPadding;							
						}
						
						self.scrollTo(newScrollTo, 0);
						
						setTimeout(function(){
							scrollWait = false;
						}, 1000);
						
					//when going left
					} else if((e.left > 50) && (e.left < scrollLeft + 50) && !scrollWait && (scrollRect.width < contentWidth)){		
						
						scrollWait = true;
						
						var newScrollTo = scrollLeft-obj.cellWidth - obj.rowPadding;
						newScrollTo = newScrollTo > 0 ? newScrollTo : 0;
						self.scrollTo(newScrollTo, 0);
						
						//move the cell as well
						v.left = v.left - obj.cellHeight - obj.rowPadding;
						
						setTimeout(function(){
							scrollWait = false;
						}, 1000);
						
					}	
					
				});						
				
				v.addEventListener('touchstart', function(e){
					changeZIndex({
						cellIndex: v.index,
						zIndex: 0
					});
				});
				
				v.addEventListener('end', function(e){
					
					//disable the touch
					enableTouch(false);
										
					var dPositionIndex = getPositionIndex(e);
					var oPositionIndex = v.position;				
					
					var eventData = {
						index: dPositionIndex,
						previousIndex: oPositionIndex,
						cell: obj.data[v.index]
					};

					//set the new position to help with animation bouncing back					
					v.left = e.left;
					v.top = e.top;
									
					animate({
						cellIndex: v.index,
						dPositionIndex: dPositionIndex,
						duration: 200,
						callback: function(){
							self.fireEvent('move', eventData);
							
					
						}
					});
					
					//move old cells
					if(dPositionIndex !== oPositionIndex){						
						var startPos = (dPositionIndex > oPositionIndex) ? oPositionIndex : dPositionIndex;
						var max = (dPositionIndex > oPositionIndex) ? ((dPositionIndex - oPositionIndex)+oPositionIndex) : ((oPositionIndex - dPositionIndex)+dPositionIndex);
						
						//splitting up the logic for now because it is hurting my brain
						if(dPositionIndex > oPositionIndex){
							//ascending
							for(var i = startPos; i < max; i++){								
								animate({
									cellIndex: posArray[i+1].cellIndex,
									dPositionIndex: i,
									callback: (i+1) !== max ? '' : (function(){
										enableTouch(true)
										
										//change back the zIndices
										changeZIndex({
											cellIndex: v.index,
											zIndex: 1
										});		
									})
								});		
							}					
						} else {
							//descending
							for(var i = startPos; i < max; i++){
								animate({
									cellIndex: posArray[i].cellIndex,
									dPositionIndex: i+1,
									callback: (i+1) !== max ? '' : (function(){
										enableTouch(true)
										
										//change back the zIndices
										changeZIndex({
											cellIndex: v.index,
											zIndex: 1
										});		
									})
								});	
							}
						}
					} else {
						enableTouch(true);
					}
				});
			})(cell);
		}
	}
	
	//perform the animation on the cell
	//obj properties:
	//cellIndex -- index of the cell in the cells array. Does not change
	//dPositionIndex -- new, or destination index in the position array
	//callback -- any callback to be performed after animation
	function animate(obj){
		cells[obj.cellIndex].animate({
			top: posArray[obj.dPositionIndex].top, 
			left: posArray[obj.dPositionIndex].left, 
			duration: obj.duration || 500 
			}, function(){
				//handle cell array movements on completion callback
				//to prevent what appeared to be race conditions			
				cells[obj.cellIndex].position = obj.dPositionIndex;
				posArray[obj.dPositionIndex].cellIndex = obj.cellIndex;
							
				//perform any callbacks
				if(typeof(obj.callback) === 'function'){
					obj.callback();
				}	
		});			
	}
	
	//change zIndex for all but the selected cell
	//found this works better than changing only selected cell zIndex
	function changeZIndex(obj){
		for(var i = 0; i < cells.length; i++){
			if(i !== obj.cellIndex){
				cells[i].zIndex = obj.zIndex;
			}	
		}		
	}
	
	//enable or disable touch to move on all cells
	function enableTouch(enable){
		for(var i = 0; i < cells.length; i++){
			if(cells[i].isEmpty !== true){
				cells[i].touchEnabled = enable;	
			}
		}
	}
	
	//get the position array index from the screen coords
	function getPositionIndex(e){
		
		var totCells = cells.length,
			totRows = Math.ceil(totCells / args.columns),
			col = args.columns-1,
			row = totRows-1,
			heightMult = (args.cellHeight + (2 * args.rowPadding)),
			widthMult = (args.cellWidth + (2 * args.columnPadding));
		
		//get the new row
		for(var i = 0; i < totRows; i++){
			if(e.top < (i * heightMult) + (heightMult / 2)){
				row = i;
				break;
			}
		}
					
		//get the new column
		for(var i = 0; i < args.columns; i++){
			if(e.left < (i * widthMult)+(widthMult/2)){
				col = i;
				break;
			}
		}
		var dPositionIndex = ((1*row)*args.columns)+col;
		
		//check to see if the index is out of bounds and just set it to the last cell
		//probably a better way to handle this
		if(dPositionIndex >= totCells){
			dPositionIndex = totCells-1;
		}
		return 	dPositionIndex;	
	}		

	function setColHeader(data){
		clearParentView(colHeader);
		
		for(var i = 0; i < data.length; i++){
			colHeader.add(data[i]);
		}
	}
	
	//HELPER FUNCTIONS

	function clearParentView(view, idx){
		idx = idx || 0;
		//clear out the parent view
	  	var viewChildren = view.children.slice(0);
		for (var i = idx; i < viewChildren.length; ++i) {
	        view.remove(viewChildren[i]);
		}				
	}	
		
	//helper function extend on object with the properties of one or more others (thanks, Dojo!)
	function extend(obj, props) {
		var empty = {};	
		
		if(!obj) {
			obj = {};
		}
		for(var i = 1, l = arguments.length; i < l; i++) {
			mixin(obj, arguments[i]);
		}
		return obj;
		
		function mixin(target, source) {
			var name, s, i;
			for(name in source) {
				if(source.hasOwnProperty(name)) {
					s = source[name];
					if(!( name in target) || (target[name] !== s && (!( name in empty) || empty[name] !== s))) {
						target[name] = s;
					}
				}
			}
			return target;
			// Object
		}		
	}

	return self;
}

module.exports = SortableView; 