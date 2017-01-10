SERVER_URL = 'https://inquiry-webhook.awspace.de/kurtaxe'

$n = (name, scope = window.document) ->
    $("[name='#{name}']", scope)


$nGetValue = (name, scope = window.document) ->
    $n(name, scope).val()

getFormContainer = (element) ->
    $(element).closest("[data-form-id]")[0]

getFormId = (element) ->
    parseInt $(element).attr("data-form-id")

# --- EVENT LISTENER
resetEventListeners = ->

    # clean up listeners
    $(".input-group input").unbind()
    $('[data-toggle="tooltip"]').tooltip()

    # initialize
    $n('fullpayer_person').on 'change', (e) ->
        changeModel 'fullPersons', e.target

    $n('fullpayer_tage').on 'change', (e) ->
        changeModel 'fullDays', e.target

    $n('reduced_person').on 'change', (e) ->
        changeModel 'reducedPersons', e.target

    $n('reduced_tage').on 'change', (e) ->
        changeModel 'reducedDays', e.target

    $n('freed_person').on 'change', (e) ->
        changeModel 'freedPersons', e.target

    $n('freed_tage').on 'change', (e) ->
        changeModel 'freedDays', e.target

    # --- copy person 1. and 2.

    $n('firstname1').on 'change', (e) ->
        formContainer = getFormContainer e.target
        $n('b_firstname1', formContainer).val e.target.value

    $n('lastname1').on 'change', (e) ->
        formContainer = getFormContainer e.target
        $n('b_lastname1', formContainer).val e.target.value

    $n('firstname2').on 'change', (e) ->
        formContainer = getFormContainer e.target
        $n('b_firstname2', formContainer).val e.target.value

    $n('lastname2').on 'change', (e) ->
        formContainer = getFormContainer e.target
        $n('b_lastname2', formContainer).val e.target.value

    # --- copy arrival and departe
    $n('b_arrival1').on 'change', (e) ->
        # formContainer = getFormContainer e.target
        # $n('b_arrival2', formContainer).val e.target.value
        # $n('b_arrival3', formContainer).val e.target.value
        # $n('b_arrival4', formContainer).val e.target.value
        # $n('b_arrival5', formContainer).val e.target.value

    $n('b_departure1').on 'change', (e) ->
        # formContainer = getFormContainer e.target
        # $n('b_departure2', formContainer).val e.target.value
        # $n('b_departure3', formContainer).val e.target.value
        # $n('b_departure4', formContainer).val e.target.value
        # $n('b_departure5', formContainer).val e.target.value

    # tooltips
    inputs = $ 'input'
    for input in inputs
        e = $ input
        placeholder = e.attr 'placeholder'
        e.attr 'title', placeholder
        e.attr 'data-toggle', 'tooltip'
        e.attr 'data-placement', 'top'

    $('[data-toggle="tooltip"]').tooltip()

# --- EVENT LISTENER END

resetEventListeners()

class Model
    Model.models = {}

    constructor: (@id) ->
        @fullPersons = 0
        @fullDays = 0
        @fullSum = 0
        @reducedPersons = 0
        @reducedDays = 0
        @reducedSum = 0
        @freedPersons = 0
        @freedDays = 0

        Model.models[@id] = this

    Model.getId = (id) ->
        unless Model.models[id]?
            return new Model id

        return Model.models[id]

changeModel = (property, element) ->
    formContainer = getFormContainer element
    value = element.value
    model = Model.getId getFormId formContainer
    model[property] = parseInt value
    updateResult formContainer, model


updateList = [
    {
        selector: 'fullpayer_summe'
        multiplicand1: 'fullPersons'
        multiplicand2:  'fullDays'
        result: 'fullSum'
        factor: 2
    }
    {
        selector: 'reduced_summe'
        multiplicand1: 'reducedPersons'
        multiplicand2:  'reducedDays'
        result: 'reducedSum'
        factor: 1
    }
]
updateResult = (scope, model) ->
    for meta in updateList

        sum = model[meta.multiplicand1] * model[meta.multiplicand2] * meta.factor
        if isNaN sum
            return $n(meta.selector, scope).val ''

        model[meta.result] = sum
        $n(meta.selector, scope).val makeEuro sum

    totalPersons = model.fullPersons + model.reducedPersons + model.freedPersons
    $n('guests_total', scope).val totalPersons

    totalSum = model.fullSum + model.reducedSum
    $n('price_total', scope).val makeEuro totalSum

makeEuro = (val) ->
    "#{val},00 €"


# ---


formId = 1
$('.add-form').on 'click', (e) ->
    copy = $('[data-form-id="1"]').clone()
    formId++
    copy.find('input').val ''
    copy.find('[name="fullpayer_euro"]').val '2,00 €'
    copy.find('[name="reduced_euro"]').val '1,00 €'
    copy.find('[name="freed_euro"]').val '0,00 €'
    copy.attr 'data-form-id', formId
    copy.find('h3').text "Kurheft Nr. #{formId}"
    copy.appendTo '.forms-container'

    resetEventListeners()
    e.preventDefault()


buttonStep1 = $ '#init-load'
buttonStep1.on 'click', (e) ->
    e.preventDefault()
    [name, id] = window.location.search.split('=')
    request = $.ajax
        url: "#{SERVER_URL}/#{id}"
        type: "GET"
        dataType: 'json'

    request.done (json, responseType, xhr) ->
        $('.step-1').hide()
        $('.step-2').show()
        data = xhr.responseJSON
        template = renderTemplate(data)
        $(template).appendTo '#booking-data'

    request.fail (xhr, responseType, statusText) ->
        if xhr.status is 404
            content = 'Daten konnten nicht übermittelt werden, weil die id in der URL fehlerhaft ist'
        else
            content = 'Entschuldigung, bitte versuchen Sie es später noch einmal'
        alert(content)
        console.log(arguments)

buttonStep2 = $ '#show-form'
buttonStep2.on 'click', (e) ->
    e.preventDefault()
    $('.step-2').hide()
    $('.step-3').show()

submitButton = $('#submit-data')
feedbackDiv = $ '#submit-feedback'
submitButton.on 'click', (e) ->
    feedbackDiv.text ''
    e.preventDefault()

    submitButtonOriginalText = submitButton.text()
    submitButton.text('Bitte warten ...')
    submitButton[0].disabled = true

    [name, id] = window.location.search.split('=')

    formData = ''
    forms = $ 'div.forms-container > div'
    for form, index in forms
        formData = formData + """
            &fullpayer_person[#{index+1}]=#{$nGetValue 'fullpayer_person', form}
            &fullpayer_tage[#{index+1}]=#{$nGetValue 'fullpayer_tage', form}
            &reduced_person[#{index+1}]=#{$nGetValue 'reduced_person', form}
            &reduced_tage[#{index+1}]=#{$nGetValue 'reduced_tage', form}
            &freed_person[#{index+1}]=#{$nGetValue 'freed_person', form}
            &freed_tage[#{index+1}]=#{$nGetValue 'freed_tage', form}
            &guests_under_18[#{index+1}]=#{$nGetValue 'guests_under_18', form}
            &firstname1[#{index+1}]=#{$nGetValue 'firstname1', form}
            &lastname1[#{index+1}]=#{$nGetValue 'lastname1', form}
            &birthday1[#{index+1}]=#{$nGetValue 'birthday1', form}
            &street[#{index+1}]=#{$nGetValue 'street', form}
            &zipcode[#{index+1}]=#{$nGetValue 'zipcode', form}
            &city[#{index+1}]=#{$nGetValue 'city', form}
            &firstname2[#{index+1}]=#{$nGetValue 'firstname2', form}
            &lastname2[#{index+1}]=#{$nGetValue 'lastname2', form}
            &birthdays2[#{index+1}]=#{$nGetValue 'birthdays2', form}
            &b_arrival1[#{index+1}]=#{$nGetValue 'b_arrival1', form}
            &b_departure1[#{index+1}]=#{$nGetValue 'b_departure1', form}
            &b_arrival2[#{index+1}]=#{$nGetValue 'b_arrival2', form}
            &b_departure2[#{index+1}]=#{$nGetValue 'b_departure2', form}
            &b_firstname3[#{index+1}]=#{$nGetValue 'b_firstname3', form}
            &b_lastname3[#{index+1}]=#{$nGetValue 'b_lastname3', form}
            &b_arrival3[#{index+1}]=#{$nGetValue 'b_arrival3', form}
            &b_departure3[#{index+1}]=#{$nGetValue 'b_departure3', form}
            &b_firstname4[#{index+1}]=#{$nGetValue 'b_firstname4', form}
            &b_lastname4[#{index+1}]=#{$nGetValue 'b_lastname4', form}
            &b_arrival4[#{index+1}]=#{$nGetValue 'b_arrival4', form}
            &b_departure4[#{index+1}]=#{$nGetValue 'b_departure4', form}
            &b_firstname5[#{index+1}]=#{$nGetValue 'b_firstname5', form}
            &b_lastname5[#{index+1}]=#{$nGetValue 'b_lastname5', form}
            &b_arrival5[#{index+1}]=#{$nGetValue 'b_arrival5', form}
            &b_departure5[#{index+1}]=#{$nGetValue 'b_departure5', form}
            &fullpayer_summe[#{index+1}]=#{$nGetValue 'fullpayer_summe', form}
            &reduced_summe[#{index+1}]=#{$nGetValue 'reduced_summe', form}
            &guests_total[#{index+1}]=#{$nGetValue 'guests_total', form}
            &price_total[#{index+1}]=#{$nGetValue 'price_total', form}
            &b_firstname1[#{index+1}]=#{$nGetValue 'b_firstname1', form}
            &b_lastname1[#{index+1}]=#{$nGetValue 'b_lastname1', form}
            &b_firstname2[#{index+1}]=#{$nGetValue 'b_firstname2', form}
            &b_lastname2[#{index+1}]=#{$nGetValue 'b_lastname2', form}
        """

    request = $.ajax
        url: "#{SERVER_URL}/#{id}"
        type: "POST"
        data: formData
        dataType: 'json'

    request.done (json, responseType, xhr) ->
        submitButton[0].disabled = true
        submitButton.text(submitButtonOriginalText)
        feedbackDiv.html '<strong style="color: #9b70fe;">Vielenk Dank, die Daten wurden erfolgreich übermittelt</strong>'
        submitButton[0].disabled = false

    request.fail (xhr, responseType, statusText) ->
        if xhr.status is 404
            content = 'Daten konnten nicht übermittelt werden, weil die id in der URL fehlerhaft ist'
        else
            content = 'Entschuldigung, bitte versuchen Sie es später noch einmal'

        alert(content)
        submitButton.text(submitButtonOriginalText)
        submitButton[0].disabled = false
        console.log(arguments)



renderTemplate = (data) ->
  {name, flat_name, flat_details_text, from, to, nights, guests} = data
  detailsHtml = ''
  if flat_details_text? and flat_details_text isnt ''
    if flat_details_text.match(/\d/g).length is 3
        value = 'gesamte Wohung'
    else
        value = flat_details_text
    detailsHtml = """
        <div>
          <span>#{value}</span>
        </div>
    """

  template = """
  <div>
    <span> Reservierung für #{name}</span>
  </div>
  <div>
    <span style="color: #9B70FE; font-weight: bold;"> Wohnung #{flat_name}</span>
  </div>

  #{detailsHtml}

  <div>
    <span> #{from} – #{to} | #{nights} Übernachtungen | #{guests} Person(en)</span>
  </div>
  """