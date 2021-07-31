import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { RootState } from '@/store'
import logger from '@/other/Logger'
import Profile from '@/other/Profile'
import ServerSideError from '@/other/ServerSideError'
import Mastodon from '../other/Mastodon'
import { Users } from './types/Users'
import { User } from './types/User'

// const ipcRenderer = window.ipc

const userCountlimit = '1000'

export const namespaced = true

export const state = () => ({
  userList: [],
  currentUser: 0,
  nextUserId: 1
}) as Users

export type UsersState = ReturnType<typeof state>

export const getters: GetterTree<UsersState, RootState> = {
  getUserList (state) {
    return state.userList
  },
  getUsers (state) {
    const { userList, nextUserId } = state
    return { userList, nextUserId }
  },
  getCurrentUserId (state) {
    return state.currentUser
  },
  getCurrentUser (state) {
    return state.userList.find(user => user.userNumber === state.currentUser)
  }
}

export const mutations: MutationTree<UsersState> = {
  add (state, payload) {
    logger.debug(payload)
    const user:User = {
      clientId: payload.clientId,
      clientSecret: payload.clientSecret,
      accessToken: payload.accessToken,
      host: payload.host,
      userNumber: state.nextUserId++,
      user: payload.user,
      followers: [],
      followings: [],
      menu: null
    }
    state.userList.push(user)
  },
  setId (state, payload) {
    state.currentUser = payload
  },
  set (state, payload) {
    state.userList = payload.userList
    state.nextUserId = payload.nextUserId
  },
  setMenu (state, payload) {
    const menu = payload
    const user = state.userList.find(
      item => item.userNumber === state.currentUser
    )
    if (user) {
      user.menu = menu
    }
  },
  setOwnFollowers (state, followers) {
    const user = state.userList.find(
      item => item.userNumber === state.currentUser
    )
    if (user) {
      user.followers = followers
    }
  },
  setOwnFollowings (state, followings) {
    const user = state.userList.find(
      item => item.userNumber === state.currentUser
    )
    if (user) {
      user.followings = followings
    }
  }
}

export const actions: ActionTree<UsersState, RootState> = {
  setCurrentUserId ({ commit }, id) {
    commit('setId', id)
  },
  saveUserConfig ({ getters }) {
    localStorage.mastootConfigUsers = JSON.stringify(getters.getUsers)
  },
  setMenu ({ commit, dispatch }, menu) {
    commit('setMenu', menu)
    dispatch('saveUserConfig')
  },
  loadUserConfig ({ commit }, _) {
    if (localStorage.mastootConfigUsers) {
      commit('set', JSON.parse(localStorage.mastootConfigUsers))
    }
  },
  async fetchOwnFollowerAndFollowing ({ dispatch }) {
    try {
      await dispatch('fetchOwnFollower')
      await dispatch('fetchOwnFollowing')
      dispatch('saveUserConfig')
    } catch (e) {
      logger.error(e)
    }
  },
  fetchOwnFollower ({ commit, getters }) {
    // const { accessToken, host, user } = getters.getCurrentUser as User
    const currentUser = getters.getCurrentUser as User
    const accessToken = currentUser.accessToken
    const host = currentUser.host
    const user = currentUser.user
    logger.debug(currentUser)
    const internalid = user.internalid
    logger.debug(user)
    logger.debug(internalid)
    return new Promise<void>((resolve, reject) => {
      const mastodon = Mastodon.getMastodon({ accessToken, host })
      mastodon.fetchProfileFollowers(
        internalid,
        { limit: userCountlimit }
      ).then((followers) => {
        commit(
          'setOwnFollowers',
          followers.map(follower => Profile.fromAccount(follower))
        )
        resolve()
      }).catch((e:ServerSideError) => {
        const returnErr = {
          error: e,
          host,
          accessToken
        }
        reject(returnErr)
      })
    })
  },
  fetchOwnFollowing ({ commit, getters }) {
    const { accessToken, host, user } = getters.getCurrentUser
    const { internalid } = user
    return new Promise<void>((resolve, reject) => {
      const mastodon = Mastodon.getMastodon({ accessToken, host })
      mastodon.fetchProfileFollowing(
        internalid,
        { limit: userCountlimit }
      ).then((followings) => {
        commit(
          'setOwnFollowings',
          followings.map(follow => Profile.fromAccount(follow))
        )
        resolve()
      }).catch((e:ServerSideError) => {
        const returnErr = {
          error: e,
          host,
          accessToken
        }
        reject(returnErr)
      })
    })
  },
  addUser ({ commit }, payload) {
    const { clientId, clientSecret, pin, host } = payload
    return new Promise<void>(async (resolve, reject) => {
      let accessToken
      try {
        accessToken = await Mastodon.loginPhase2(
          clientId,
          clientSecret,
          pin,
          host
        )
        const mastodon = Mastodon.getMastodon({ accessToken, host })
        const result = await mastodon.fetchOwnAccount()
        if (result.resp.statusCode !== 200) {
          reject(result)
        }
        commit('add', {
          clientId,
          clientSecret,
          accessToken,
          host,
          user: Profile.fromAccount(result.data)
        })
        resolve()
      } catch (e) {
        const returnErr = {
          error: e,
          host,
          accessToken
        }
        reject(returnErr)
      }
    })
  },
  getPIN (_, host) {
    return Mastodon.loginPhase1(host)
  }
}
