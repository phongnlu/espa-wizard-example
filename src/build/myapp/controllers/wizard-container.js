import {
    getCss,
    bindEvents
} from '../utils.js';
import {
    getDummyJsonAsPromise
} from '../services/dummy.js';
import {
    getState
} from '../services/state-machine.js';

import {
    wizardEngine,
    WizardBarListener
} from '../services/wizard-services.js';
import {
    apiService
} from "../services/api-client-services.js"
import tpl from '../views/wizard-container.html';
import tplBar from '../views/wizard-button-bar.html';

class WizardContainerWizardBarListener extends WizardBarListener {

    onStateChange(state) {
        var backButtonClasses = document.getElementById("back-wizard").classList;
        var nextButtonClasses = document.getElementById("next-wizard").classList;
        var cancelButtonClasses = document.getElementById("cancel-wizard").classList;
        if (state.next) {
            nextButtonClasses.remove("disabled");
        } else {
            nextButtonClasses.add("disabled");
        }
        if (state.back) {
            backButtonClasses.remove("disabled");
        } else {
            backButtonClasses.add("disabled");
        }
        if (state.cancel) {
            cancelButtonClasses.remove("disabled");
        } else {
            cancelButtonClasses.add("disabled");
        }
    }
}

let viewData = null;
let serviceData = null;
let factoryScope = null;

const factory = ((injected) => {
    const self = {
        cfg: (injected && injected.cfg) ? injected.cfg : null,
        tpl: (injected && injected.tpl) ? injected.tpl : tpl,
        tplBar: (injected && injected.tplBar) ? injected.tplBar : tplBar
    }

    //overridding
    factoryScope = ESPA.factoryMixin(self, injected);

    init();

    return factoryScope;
});

function init() {
    ESPA.registerRoute('wizard-container', _registerRouteCallback);
    wizardEngine.registerStateListener(new WizardContainerWizardBarListener());
}

function _registerRouteCallback(data) {
    viewData = data || {};

    return Promise.all([
            ESPA.loadResource.css(getCss()),
            getDummyJsonAsPromise()
        ])
        .then((results) => {
            serviceData = results[1];
            viewData = Object.assign(viewData, serviceData);
            _displayView();
        })
        .catch(e => {
            ESPA.logger.error(e);
            return Promise.reject({
                error: '_registerRouteCallback promise chain terminated'
            });
        });
}

function _displayView() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('main-content').innerHTML = ESPA.tmpl(factoryScope.tpl, viewData);
    document.getElementById('wizard-button-bar').innerHTML = ESPA.tmpl(factoryScope.tplBar, viewData);
    document.getElementById('main-container').style.display = 'block';

    bindEvents({
        'click #go-to-bar': _onGoToBar,
        'click #back-wizard': _onBackWizard,
        'click #next-wizard': _onNextWizard,
        'click #cancel-wizard': _onCancelWizard
    });
    wizardEngine.setCurrentState({
        currentPage: null,
        nextPage: null,
        backPage: null,
        back: false,
        next: false,
        cancel: true
    });
    ESPA.navigate('page-id-token');
}

function _onBackWizard(e) {
    e.preventDefault();

    console.log("_onBackWizard");
    wizardEngine.OnBackWizardPage().then((result) => {
        if (result) {
            var state = wizardEngine.getCurrentState();
            ESPA.navigate(state.backPage);
        }

    });
}

function _onNextWizard(e) {
    e.preventDefault();

    console.log("_onNextWizard");
    wizardEngine.OnNextWizardPage().then((result) => {
        if (result) {
            var state = wizardEngine.getCurrentState();
            ESPA.navigate(state.nextPage);
        }

    });
}

function _onCancelWizard(e) {
    e.preventDefault();

    console.log("_onCancelWizard");
    var ok = wizardEngine.OnCancelWizardPage();
}

function _onGoToBar(e) {
    e.preventDefault();

    ESPA.navigate('bar');
}

export {
    factory,
    _registerRouteCallback
};