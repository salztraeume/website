function horizontalSubNavigation() {
	var dropdownSelector = ".dropdown-toggle";
	var parent = "li.dropdown";
	var lastTarget = null;
	var currentTarget = null;

	$(dropdownSelector).on("click", function(e) {
		if(e.eventPhase != null) {
			// native click, ignore it
			return false;
		}
		return true;
	});

	$(dropdownSelector).on("mouseenter", function(e) {
		// ignore if the same sub nav is hovered within the timeout
		// retriggering would hide the items again
		var eventTarget = $(e.target).parents(parent)[0];
		currentTarget = eventTarget;
		if (lastTarget != eventTarget) {
			if (lastTarget != null) {
				// hide the previous subitem
				$(lastTarget).trigger("click");
			}
			$(e.target).trigger("click");
			lastTarget = eventTarget;
		}
		
	});
	$(dropdownSelector).on("mouseleave", function(e) {
		var eventTarget = $(e.target).parents(parent)[0];
		currentTarget = null;
		// TODO: clear old timeouts if newer come in
		setTimeout(function() {
			if (currentTarget == null && lastTarget === eventTarget) {
				// hide only if the last target is still open
				$(e.target).trigger("click");
				lastTarget = null;
			}
		}, 200);
	});
};
horizontalSubNavigation();