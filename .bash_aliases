alias cdas='cd /data/sfsf/workspace/trunk/au-timemanagement/au-timemanagement-sapui5-web'
alias cda='cd /data/sfsf/workspace/trunk/au-timemanagement'
alias cdbs='cd /data/sfsf/workspace/trunk/build-system'
alias gcm='git checkout master'
alias gpm='git checkout master && git pull && git checkout -'
alias cdf='cd $(find / -maxdepth 6 ! -iname ".*" -type d 2> >(grep -v denied >&2) | sort | fzf --header="Change to directory")' 

