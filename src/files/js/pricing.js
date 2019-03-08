var PRICING_RULES_URL = 'https://sas-public.awspace.de/ext-api/rules.json';
if (window.location.hostname === 'localhost') {
    PRICING_RULES_URL = '//localhost:5001/ext-api/rules.json'
}

const select = $('.saison-container select.saisons')
const minStay = $('.saison-container .min-stay')
const ranges = $('.saison-container .ranges')

const now = new Date()
const nowDateString = now.toISOString().substr(0, 10)
const currentYear = now.getFullYear()

if (select.length > 0) {
	var request = $.get(PRICING_RULES_URL).done(function(data, status, xhr) {
		window.rules = data
		updateSelect()
		registerChangeHandler()
		autoSelectCurrentSaison()
	}).fail(function() {
		alert('Preise konnten nicht geladen werden')
		console.log(arguments)
	})
}

function updateSelect() {
	select.empty()
	select.append('<option disabled selected>Bitte wählen</option>')
	rules.saisons.forEach(function(s) {
		select.append('<option>' + s.name + '</option>')
	})

}

function registerChangeHandler() {
	$(select).on('change', function(e) {
		const value = e.target.value
		const saison = rules.saisons.filter(s => s.name == value)[0]
		ranges.empty()
		minStay.text('')
		
		minStay.text('Mindestaufenthalt: ' + saison.minStay + ' Nächte')
		const elements = saison.ranges.forEach(function(r) {
			const from = moment(r.from).format(DE_FORMATTER)
			const to = moment(r.to).format(DE_FORMATTER)
			if (r.from.indexOf(currentYear) != -1) {
				ranges.append('<p>' + from + ' bis ' + to + '</p>')
			}
		})
		updateTable(saison)
	})
}

function autoSelectCurrentSaison() {
	let currentSaison = ''
	rules.saisons.forEach(function(s) {
		s.ranges.forEach(function(r) {
			if (nowDateString >= r.from && nowDateString <= r.to ) {
				currentSaison = s
			}
		})
	})
	select.val(currentSaison.name).trigger('change')
	updateTable(currentSaison)
}

const baseSL = $('.base-SL')
const baseEH = $('.base-EH')
const baseSW = $('.base-SW')
const baseFS = $('.base-FS')

const exraEH1= $('.extra-EH-1')
const exraSW1= $('.extra-SW-1')
const exraSW2= $('.extra-SW-2')
const exraFS1= $('.extra-FS-1')
const exraFS2= $('.extra-FS-2')
const exraFS3= $('.extra-FS-3')

const serviceFee = $('.service-fee')
const serviceFeeFS = $('.service-fee-FS')
const extraFSPerson = $('.extra-fs-person')

function updateTable(saison) {
	const price = saison.price
	const baseSettings = rules.baseSettings

	serviceFee.text(baseSettings.EH.service + ' €')

	const includedPersons = baseSettings.FS.personsInclusive
	const formula = baseSettings.FS.extraService.formula
	const priceSample = eval(formula.replace('$x', includedPersons - 1))
	const priceSampleAbove = eval(formula.replace('$x', includedPersons))
	const priceFeePerAdditionalPerson = priceSampleAbove - priceSample
	serviceFeeFS.text(priceSample + ' €')
	extraFSPerson.text(priceFeePerAdditionalPerson + ' €')

	baseSL.text(price.SL + ' €')
	baseEH.text(price.EH + ' €')
	baseSW.text(price.SW + ' €')
	baseFS.text(price.FS + ' €')

	exraEH1.text(price.EH + baseSettings.EH.extraPersons.byAge.adult + ' €')
	exraSW1.text(price.SW + baseSettings.SW.extraPersons.byAge.adult + ' €')
	exraSW2.text(price.SW + baseSettings.SW.extraPersons.byAge.adult * 2 + ' €')

	exraFS1.text(price.FS + baseSettings.FS.extraPersons.byAge.adult * 1 + ' €')
	exraFS2.text(price.FS + baseSettings.FS.extraPersons.byAge.adult * 2 + ' €')
	exraFS3.text(price.FS + baseSettings.FS.extraPersons.byAge.adult * 3 + ' €')
}


