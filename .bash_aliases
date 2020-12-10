# Git
alias gs='git status'
alias gcm='git checkout master'
alias gc='git checkout'
alias gpm='git checkout master && git pull && git checkout -'

# Usual repositories in the gradle workspace (e.g. for git commands)
alias cda='cd ${GRADLE_WORKSPACE}/au-timemanagement'
alias cdab='cd ${GRADLE_WORKSPACE}/au-absencemanagement'
alias cdbs='cd ${GRADLE_WORKSPACE}/build-system'

# Usual submodules in au-absencemanagement (e.g. for OPA tests)
alias cdas='cd ${GRADLE_WORKSPACE}/au-absencemanagement/au-absencemanagement-sapui5-web'
alias cdap='cd ${GRADLE_WORKSPACE}/au-absencemanagement/au-absencemanagement-sap.sf.timemanagement.payoutAndPurchase-web/'
alias cdac='cd $(find $GRADLE_WORKSPACE/au-absencemanagement -maxdepth 1 ! -iname ".*" -type d -name "*sap*" | sort | fzf --header="Change to au-absencemanagement subdirectory")'

# Docker shortcuts
alias stop-all-docker-containers='docker stop $(docker ps -qa)'
alias pause-all-docker-containers='docker pause $(docker ps -qa)'
alias unpause-all-docker-containers='docker unpause $(docker ps -qa)'

# Upgrade and migrate
alias upgrade-and-migrate-tomcat='gw upgradeTomcat -Dargs='"'"'-c attime devMode'"'"' && gw migrateTomcat -Dargs='"'"'-c attime devMode'"'"''

# K8s shortcuts
alias wpods='watch kubectl get pods'
alias cfpod='kubectl get pods | awk '"'"'{print $1}'"'"' | grep mybizx-cf'
