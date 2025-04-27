;; SafeForge: Secure Contract Generation System
;; A controlled, auditable contract creation mechanism for the Stacks blockchain

;; Error Codes
(define-constant ERR_NOT_AUTHORIZED u1000)
(define-constant ERR_TEMPLATE_NOT_FOUND u1001)
(define-constant ERR_TEMPLATE_ALREADY_EXISTS u1002)
(define-constant ERR_INVALID_TEMPLATE u1003)
(define-constant ERR_CONTRACT_GENERATION_FAILED u1004)

;; Admin Management
(define-map admins principal bool)

;; Template Registry
(define-map contract-templates 
  (string-ascii 50)  ;; Template Name 
  (tuple 
    (creator principal)
    (template-code (buff 4096))
    (is-approved bool)
  )
)

;; Contract Generation Events Log
(define-map contract-generation-events
  uint  ;; Event ID
  (tuple
    (template-name (string-ascii 50))
    (generator principal)
    (generation-time uint)
  )
)

;; Track the next event ID
(define-data-var next-event-id uint u0)

;; Admin Authorization Check (Private Function)
(define-private (is-admin (user principal))
  (default-to false (map-get? admins user))
)

;; Add a new admin (only callable by existing admin)
(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-admin tx-sender) (err ERR_NOT_AUTHORIZED))
    (map-set admins new-admin true)
    (ok true)
  )
)

;; Register a new contract template
(define-public (register-template 
  (template-name (string-ascii 50))
  (template-code (buff 4096))
)
  (begin
    ;; Validate admin access
    (asserts! (is-admin tx-sender) (err ERR_NOT_AUTHORIZED))
    
    ;; Check template doesn't already exist
    (asserts! 
      (is-none (map-get? contract-templates template-name)) 
      (err ERR_TEMPLATE_ALREADY_EXISTS)
    )
    
    ;; Register template (initially unapproved)
    (map-set contract-templates template-name {
      creator: tx-sender,
      template-code: template-code,
      is-approved: false
    })
    
    (ok true)
  )
)

;; Approve a contract template (admin-only)
(define-public (approve-template (template-name (string-ascii 50)))
  (let 
    ((template (unwrap! 
      (map-get? contract-templates template-name) 
      (err ERR_TEMPLATE_NOT_FOUND)
    )))
    
    ;; Validate admin access
    (asserts! (is-admin tx-sender) (err ERR_NOT_AUTHORIZED))
    
    ;; Update template approval status
    (map-set contract-templates template-name 
      (merge template { is-approved: true })
    )
    
    (ok true)
  )
)

;; Generate a new contract from an approved template
(define-public (generate-contract 
  (template-name (string-ascii 50))
  (contract-deployment-data (buff 4096))
)
  (let 
    ((template (unwrap! 
      (map-get? contract-templates template-name) 
      (err ERR_TEMPLATE_NOT_FOUND)
    )))
    
    ;; Validate template is approved
    (asserts! 
      (get is-approved template) 
      (err ERR_INVALID_TEMPLATE)
    )
    
    ;; Increment event tracking
    (var-set next-event-id (+ (var-get next-event-id) u1))
    
    ;; Log contract generation event
    (map-set contract-generation-events 
      (var-get next-event-id)
      {
        template-name: template-name,
        generator: tx-sender,
        generation-time: block-height
      }
    )
    
    ;; TODO: Actual contract deployment logic would be implemented here
    ;; This is a placeholder response
    (ok {
      event-id: (var-get next-event-id),
      template-name: template-name
    })
  )
)

;; Initial contract setup: Contract deployer becomes first admin
(define-private (initialize)
  (begin
    (map-set admins contract-caller true)
    true
  )
)

;; Run initialization on contract deploy
(initialize)

;; Read-only function to check admin status
(define-read-only (is-authorized-admin (user principal))
  (is-admin user)
)