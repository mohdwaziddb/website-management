// Website Management — har push (main) par build + live deploy. Saara kaam deploy/deploy.sh me.
pipeline {
    agent any
    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    // GitHub webhook laga ho to ye zaroori nahi; na ho to har 5 min me naya commit dekhta hai
    triggers {
        pollSCM('H/5 * * * *')
    }
    stages {
        stage('Build & Deploy') {
            steps {
                sh 'bash deploy/deploy.sh'
            }
        }
    }
}
