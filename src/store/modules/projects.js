import VueResource from 'vue-resource'
import Vue from 'vue'

// Internal modules
import SitesModule from './projects/sites'
import PathsModule from './projects/paths'
import MapModule from './projects/map'

Vue.use(VueResource)

/* eslint-disable */
export default {
  namespaced: true,
  state: {
    current: {
      id: 0,
      name: '',
      latitude: 0.0,
      longitude: 0.0,
      zoom: 0,
      writable: true
    },
    list: []
  },
  getters : {
    currentId: state => {
      return state.current.id
    },
    findIndexById: state => id => {
      return state.list.findIndex(item => item.id === id)
    },
    findProjectById: state => id => {
      return state.list.find(item => item.id === id)
    }
  },
  mutations: {
    setCurrentProject (state, current) {
      state.current = current
    },
    setListProjects (state, list) {
      state.list = list
    },
    setLatitude (state, latitude) {
      state.current.latitude = latitude
    },
    setLongitude (state, longitude) {
      state.current.longitude = longitude
    },
    setZoom (state, zoom) {
      state.current.zoom = zoom
    },
    addNewProject (state, project) {
      state.list.push(project)
    },
    deleteListProject (state, index) {
      state.list.splice(index, 1) // Eliminem un element
    }
  },
  actions: {
    setCurrent (context, id) {
      return new Promise((resolve, reject) => {
        // Do something here... lets say, a http call using vue-resource
        Vue.http.get(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/' + id).then(response => {
          // success callback
          let project = {
            id: response.body.id,
            name: response.body.name,
            latitude: response.body.latitude,
            longitude: response.body.longitude,
            zoom: response.body.zoom
          }
          // Comprovem si el projecte es writable
          project.writable = (typeof(response.body.users.find(item => item.user === context.rootGetters['user/currentId'])) === 'object')
          context.commit('setCurrentProject', project)
          context.dispatch('map/setLocation', { latitude: project.latitude, longitude: project.longitude })
          context.dispatch('map/setZoom', project.zoom)
          // We load sites
          context.dispatch('loadSites').then(response => {
            context.dispatch('loadPaths').then(response => {
              resolve(response)
            }, error => {
              reject(error)
            })
          }, error => {
            reject(error)
          })
        }, error => {
          // http failed, let the calling function know that action did not work out
          reject(error)
        })
      })
    },
    updateCurrent (context, form) {

    },
    loadProjectsList (context) {
      return new Promise((resolve, reject) => {
        Vue.http.get(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/').then(response => {
          // success callback
          for (let x in response.body) {
            response.body[x].writable = (typeof(response.body[x].users.find(item => item.user === context.rootGetters['user/currentId'])) === 'object')
          }
          context.commit('setListProjects', response.body)
          resolve(response)
        }, error => {
          // http failed, let the calling function know that action did not work out
          reject(error)
        })
      })
    },
    addNewProject (context, name) {
      return new Promise((resolve, reject) => {
        let project = {
          name: name,
          status: 'define',
          latitude: fiberfy.constants.PROJECT_DEFAULT_LATITUDE,
          longitude: fiberfy.constants.PROJECT_DEFAULT_LONGITUDE,
          zoom: fiberfy.constants.PROJECT_DEFAULT_ZOOM
        }
        Vue.http.post(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/', project).then(response => {
          Vue.http.get(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/' + response.body.project).then(response => {
            context.commit('addNewProject', response.body)
            resolve(response)
          }, error => {
            reject(error)
          })
        }, error => {
          reject(error)
        })
      })
    },
    deleteProject (context, project) {
      return new Promise((resolve, reject) => {
        Vue.http.delete(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/' + project).then(response => {
          let index = context.getters.findIndexById(project)
          context.commit('deleteListProject', index)
          resolve(response)
        }, error => {
          reject(error)
        })
      })
    },
    savePos (context) {
      return new Promise((resolve, reject) => {
        let loc = context.getters['map/currentLocation']
        Vue.http.put(fiberfy.constants.BASE_URL + fiberfy.constants.API_VERSION + '/project/' + context.getters.currentId, loc).then(response => {
          context.commit('setLatitude', loc.latitude)
          context.commit('setLongitude', loc.longitude)
          context.commit('setZoom', loc.zoom)
          resolve(response)
        }, error => {
          reject(error)
        })
      })
    },
    findProjectById (context, id) {
      return new Promise((resolve, reject) => {
        resolve(context.getters.findProjectById(id))
      })
    }
  },
  modules: {
    sites: SitesModule,
    paths: PathsModule,
    map: MapModule
  }
}
/* eslint-enable */
