/* ====== EF CRM-mode (adjusted) ====== */
let contactSearchCallback

/** helper */
function postToParent(type, data) {
  try {
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
    window.parent && window.parent.postMessage(JSON.stringify({ type, data }), '*')
  }
  catch (e) {
    console.error('EF postToParent error', e)
  }
}

function ensurePC() {
  if (!window.PureCloud) {
    console.warn('[EF CRM] PureCloud belum siap')
    return false
  }
  return true
}

window.Framework = {
  /* ---------- CONFIG ---------- */
  config: {
    name: 'SOLUTIF CRM',
    clientIds: {
      'mypurecloud.jp': '35a7aff8-9927-4bc2-86d9-7bb9c0274ca3', // <- new implicit grant client
    },
    customInteractionAttributes: ['PT_URLPop', 'PT_SearchValue', 'PT_TransferContext'],
    settings: {
      embedWebRTCByDefault: true,
      hideWebRTCPopUpOption: false,
      enableCallLogs: true,
      enableTransferContext: true,
      hideCallLogSubject: true,
      hideCallLogContact: false,
      hideCallLogRelation: false,
      searchTargets: ['people', 'queues', 'frameworkcontacts'],
      theme: {
        primary: '#ffffff',
        text: '#ED1B24',
      },
      // NOTE: kalau OAuth lu pakai popup login, pastikan redirect URIs include /crm/authWindow.html
      // dedicatedLoginWindow: true, // <- aktifkan kalau memang pakai popup auth
    },
  },

  /* ---------- LIFECYCLE ---------- */
  initialSetup() {
    console.warn('[EF CRM] initialSetup trigger')

    if (!ensurePC()) {
      // coba polling sebentar sampe PureCloud muncul
      let tries = 0
      const itv = setInterval(() => {
        tries++
        if (ensurePC()) {
          clearInterval(itv)
          return window.Framework._bind()
        }
        if (tries > 40) { // ~12s
          clearInterval(itv)
          console.error('[EF CRM] PureCloud gak ready setelah nunggu')
        }
      }, 300)
      return
    }
    window.Framework._bind()
  },

  _bind() {
    try {
      console.warn('[EF CRM] binding subscriptions & message handlers')

      /* ---- SUBSCRIPTIONS ---- */
      window.PureCloud.subscribe([
        {
          type: 'Interaction',
          callback(category, interaction) {
            postToParent('interactionSubscription', { category, interaction })
          },
        },
        {
          type: 'UserAction',
          callback(category, data) {
            postToParent('userActionSubscription', { category, data })
          },
        },
        {
          type: 'Notification',
          callback(category, data) {
            postToParent('notificationSubscription', { category, data })
          },
        },
      ])

      /* ---- BRIDGE FROM PARENT ---- */
      window.addEventListener('message', (event) => {
        // biome-ignore lint/complexity/useOptionalChain: <explanation>
        const payload = event && event.data
        let msg = null

        // payload bisa string (JSON) atau object langsung
        if (typeof payload === 'string') {
          try {
            msg = JSON.parse(payload)
          }
          catch (e) {
            console.error('EF message parse error', e)
            return
          }
        }
        else if (payload && typeof payload === 'object') {
          msg = payload
        }
        if (!msg || !msg.type)
          return

        // support 2 naming: legacy (tutorial) & modern (EF:*)
        const type = msg.type
        const data = msg.data || msg.payload || {}

        try {
          switch (type) {
            // ====== Legacy names (dari tutorial) ======
            case 'clickToDial':
              ensurePC() && window.PureCloud.clickToDial(data)
              break
            case 'addAssociation':
              ensurePC() && window.PureCloud.addAssociation(data)
              break
            case 'addAttribute':
              ensurePC() && window.PureCloud.addCustomAttributes(data)
              break
            case 'addTransferContext':
              ensurePC() && window.PureCloud.addTransferContext(data)
              break
            case 'sendContactSearch':
              if (contactSearchCallback)
                contactSearchCallback(data)
              break
            case 'updateUserStatus':
              ensurePC() && window.PureCloud.User.updateStatus(data)
              break
            case 'updateInteractionState':
              ensurePC() && window.PureCloud.Interaction.updateState(data)
              break
            case 'setView':
              ensurePC() && window.PureCloud.User.setView(data)
              break
            case 'updateAudioConfiguration':
              ensurePC() && window.PureCloud.User.Notification.setAudioConfiguration(data)
              break
            case 'sendCustomNotification':
              ensurePC() && window.PureCloud.User.Notification.notifyUser(data)
              break

            // ====== Modern names (yang gue saranin kemarin) ======
            case 'EF:CLICK_TO_DIAL':
              ensurePC() && window.PureCloud.clickToDial(data)
              break
            case 'EF:ADD_ASSOCIATION':
              ensurePC() && window.PureCloud.addAssociation(data)
              break
            case 'EF:ADD_ATTRIBUTES':
              ensurePC() && window.PureCloud.addCustomAttributes(data)
              break
            case 'EF:ADD_TRANSFER_CONTEXT':
              ensurePC() && window.PureCloud.addTransferContext(data)
              break
            case 'EF:SET_STATUS':
              ensurePC() && window.PureCloud.User.updateStatus(data)
              break
            case 'EF:UPDATE_INTERACTION':
              ensurePC() && window.PureCloud.Interaction.updateState(data)
              break
            case 'EF:SET_VIEW':
              ensurePC() && window.PureCloud.User.setView(data)
              break
            case 'EF:NOTIFY':
              ensurePC() && window.PureCloud.User.Notification.notifyUser(data)
              break
            default:
              // no-op
              break
          }
        }
        catch (err) {
          console.error('[EF CRM] handler error:', type, err)
        }
      })
    }
    catch (e) {
      console.error('[EF CRM] _bind error:', e)
    }
  },

  /* ---------- CALLBACKS KE PARENT (dipanggil EF) ---------- */
  screenPop(searchString, interactionId) {
    // Extract custom attributes dari interaction
    let contactId = null
    let customAttributes = {}

    // Coba ambil interaction data dari PureCloud
    if (window.PureCloud && window.PureCloud.Interaction) {
      try {
        // Get current interaction data
        const interaction = window.PureCloud.Interaction.getCurrentInteraction()
        if (interaction && interaction.attributes) {
          customAttributes = interaction.attributes

          // Extract contact ID dari custom attributes
          // Bisa dari PT_SearchValue atau attribute lain yang lu set
          contactId = interaction.attributes.PT_SearchValue
            || interaction.attributes.PT_ContactID
            || interaction.attributes.contactId
            || null
        }
      }
      catch (e) {
        console.warn('[EF CRM] Error getting interaction attributes:', e)
      }
    }

    postToParent('screenPop', {
      searchString,
      interactionId,
      contactId,
      customAttributes,
    })
  },

  processCallLog(callLog, interactionId, eventName, onSuccess, onFailure) {
    try {
      postToParent('processCallLog', { callLog, interactionId, eventName })
      // simulasi sukses; ganti sesuai logic lu kalau mau nulis ke BE
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      onSuccess && onSuccess({ id: callLog.id || Date.now() })
    }
    catch (e) {
      console.error('[EF CRM] processCallLog error:', e)
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      onFailure && onFailure()
    }
  },

  openCallLog(callLog, interaction) {
    postToParent('openCallLog', { callLog, interaction })
  },

  contactSearch(searchString, onSuccess, _onFailure) {
    contactSearchCallback = onSuccess
    postToParent('contactSearch', { searchString })
  },
}

/* ---- Global error traps (buat debug) ---- */
window.addEventListener('error', (e) => {
  console.error('[EF CRM] window error:', e && e.message, e && e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('[EF CRM] unhandled rejection:', e && e.reason)
})

console.warn('[EF CRM] framework.js loaded ✅')
