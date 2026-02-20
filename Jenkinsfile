pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-20'
    }
    
    environment {
        AWS_REGION = 'us-east-1'
        EB_APP_NAME = 'demo-account-activity-monitor'
        EB_ENV_NAME = 'Demo-account-activity-monitor-env'
        S3_BUCKET  = 'elasticbeanstalk-deploy-bucket'
    }
    
    stages {

        stage('📥 Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('🔍 Verify Environment') {
            steps {
                sh '''
                    echo "Node Version:"
                    node --version
                    echo "NPM Version:"
                    npm --version
                    echo "AWS CLI Version:"
                    aws --version
                '''
            }
        }

        stage('📦 Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('🧪 Run Tests') {
            steps {
                sh '''
                    echo "Running tests..."
                    # Uncomment when ready
                    # npm test
                    echo "Tests passed"
                '''
            }
        }

        stage('📦 Create Deployment Package') {
            steps {
                sh '''
                    rm -f deploy.zip

                    zip -r deploy.zip . \
                        -x "*.git*" \
                        -x "*.zip" \
                        -x "*node_modules*" \
                        -x "*.md" \
                        -x "Jenkinsfile"

                    ls -lh deploy.zip
                '''
            }
        }

        stage('📤 Upload to S3') {
            steps {
                sh '''
                    VERSION_LABEL="jenkins-${BUILD_NUMBER}-$(date +%Y%m%d-%H%M%S)"
                    echo "Version: $VERSION_LABEL"

                    aws s3 cp deploy.zip \
                        s3://${S3_BUCKET}/deployments/${VERSION_LABEL}.zip \
                        --region ${AWS_REGION}

                    echo $VERSION_LABEL > version_label.txt
                '''
            }
        }

        stage('🚀 Deploy to Elastic Beanstalk') {
            steps {
                sh '''
                    VERSION_LABEL=$(cat version_label.txt)

                    aws elasticbeanstalk create-application-version \
                        --application-name ${EB_APP_NAME} \
                        --version-label ${VERSION_LABEL} \
                        --source-bundle S3Bucket=${S3_BUCKET},S3Key=deployments/${VERSION_LABEL}.zip \
                        --region ${AWS_REGION}

                    aws elasticbeanstalk update-environment \
                        --environment-name ${EB_ENV_NAME} \
                        --version-label ${VERSION_LABEL} \
                        --region ${AWS_REGION}

                    echo "Deployment started for version ${VERSION_LABEL}"
                '''
            }
        }

        stage('⏳ Wait for Deployment') {
            steps {
                sh '''
                    VERSION_LABEL=$(cat version_label.txt)
                    echo "Waiting for environment to become healthy..."

                    for i in {1..30}; do
                        STATUS=$(aws elasticbeanstalk describe-environments \
                            --environment-names ${EB_ENV_NAME} \
                            --region ${AWS_REGION} \
                            --query 'Environments[0].Status' \
                            --output text)

                        HEALTH=$(aws elasticbeanstalk describe-environments \
                            --environment-names ${EB_ENV_NAME} \
                            --region ${AWS_REGION} \
                            --query 'Environments[0].Health' \
                            --output text)

                        echo "Status: $STATUS | Health: $HEALTH"

                        if [ "$STATUS" = "Ready" ] && [ "$HEALTH" = "Green" ]; then
                            echo "Deployment successful!"
                            exit 0
                        fi

                        if [ "$STATUS" = "Ready" ] && [ "$HEALTH" = "Red" ]; then
                            echo "Deployment failed!"
                            exit 1
                        fi

                        sleep 20
                    done

                    echo "Deployment timeout"
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed! Check logs.'
        }
        always {
            cleanWs()
        }
    }
}